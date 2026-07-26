/**
 * PushService -- Web Push fan-out.
 *
 * The behaviour worth protecting is the expired-subscription cleanup: browsers
 * return 410 Gone (or 404) for a subscription the user has revoked or that has
 * rotated, and if those rows are never deleted the table grows forever and every
 * future broadcast wastes a request per dead endpoint.
 *
 * The service reads VAPID keys in its constructor and the module exports an
 * already-constructed instance, so each test re-imports it inside
 * jest.isolateModules with the environment it needs.
 */

jest.mock('web-push');
// Automocking the repository still evaluates the real module to derive its
// shape, which pulls in config/database and throws without Supabase env vars.
// Mocking the database too keeps this suite runnable with no environment at all.
jest.mock('../../config/database');
jest.mock('../../repositories/PushSubscriptionRepository');

import webpush from 'web-push';
import PushSubscriptionRepository from '../../repositories/PushSubscriptionRepository';

const sendNotification = webpush.sendNotification as jest.Mock;
const setVapidDetails = webpush.setVapidDetails as jest.Mock;
const findByUserIds = PushSubscriptionRepository.findByUserIds as jest.Mock;
const deleteByEndpoint = PushSubscriptionRepository.deleteByEndpoint as jest.Mock;

const ORIGINAL_ENV = { ...process.env };

/** Re-import the service with VAPID keys either configured or absent. */
function loadService({ configured = true } = {}) {
    if (configured) {
        process.env.VAPID_PUBLIC_KEY = 'test-public-key';
        process.env.VAPID_PRIVATE_KEY = 'test-private-key';
        process.env.VAPID_SUBJECT = 'mailto:test@example.com';
    } else {
        delete process.env.VAPID_PUBLIC_KEY;
        delete process.env.VAPID_PRIVATE_KEY;
    }

    let service: any;
    jest.isolateModules(() => {
        service = require('../../services/pushService').default;
    });
    return service;
}

const subscription = (endpoint: string) => ({
    endpoint,
    p256dh: `p256dh-${endpoint}`,
    auth: `auth-${endpoint}`
});

const gone = (statusCode: number) => Object.assign(new Error('subscription gone'), { statusCode });

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.restoreAllMocks();
});

describe('configuration', () => {
    it('registers VAPID details when both keys are present', () => {
        loadService({ configured: true });

        expect(setVapidDetails).toHaveBeenCalledWith(
            'mailto:test@example.com', 'test-public-key', 'test-private-key'
        );
    });

    it('stays disabled and sends nothing when keys are missing', async () => {
        const service = loadService({ configured: false });

        await service.sendToUsers(['u1'], { title: 'hi' });

        // Missing keys must degrade to a no-op, not a crash on every publish.
        expect(setVapidDetails).not.toHaveBeenCalled();
        expect(findByUserIds).not.toHaveBeenCalled();
        expect(sendNotification).not.toHaveBeenCalled();
    });
});

describe('sendToUsers -- short circuits', () => {
    it('does nothing for an empty or missing recipient list', async () => {
        const service = loadService();

        await service.sendToUsers([], { title: 'hi' });
        await service.sendToUsers(null, { title: 'hi' });
        await service.sendToUsers(undefined, { title: 'hi' });

        expect(findByUserIds).not.toHaveBeenCalled();
    });

    it('does nothing when no recipient has a subscription', async () => {
        const service = loadService();
        findByUserIds.mockResolvedValue([]);

        await service.sendToUsers(['u1'], { title: 'hi' });

        expect(sendNotification).not.toHaveBeenCalled();
    });
});

describe('sendToUsers -- delivery', () => {
    it('sends one notification per subscription with the serialised payload', async () => {
        const service = loadService();
        findByUserIds.mockResolvedValue([subscription('https://push/1'), subscription('https://push/2')]);
        sendNotification.mockResolvedValue({});

        const payload = { title: 'New chapter', url: '/story/nishithini' };
        await service.sendToUsers(['u1', 'u2'], payload);

        expect(sendNotification).toHaveBeenCalledTimes(2);
        expect(sendNotification).toHaveBeenCalledWith(
            {
                endpoint: 'https://push/1',
                keys: { p256dh: 'p256dh-https://push/1', auth: 'auth-https://push/1' }
            },
            JSON.stringify(payload)
        );
    });

    it('one failing endpoint does not stop the others', async () => {
        const service = loadService();
        findByUserIds.mockResolvedValue([
            subscription('https://push/1'),
            subscription('https://push/2'),
            subscription('https://push/3')
        ]);
        sendNotification
            .mockResolvedValueOnce({})
            .mockRejectedValueOnce(gone(500))
            .mockResolvedValueOnce({});

        // Promise.allSettled is what guarantees this; a Promise.all would abort
        // the broadcast for everyone after the first failure.
        await expect(service.sendToUsers(['u1'], { title: 'hi' })).resolves.toBeUndefined();
        expect(sendNotification).toHaveBeenCalledTimes(3);
    });

    it('swallows a repository failure rather than failing the caller', async () => {
        const service = loadService();
        findByUserIds.mockRejectedValue(new Error('db down'));

        // Publishing a chapter must not fail because push lookup broke.
        await expect(service.sendToUsers(['u1'], { title: 'hi' })).resolves.toBeUndefined();
    });
});

describe('expired-subscription cleanup', () => {
    it.each([410, 404])('deletes the subscription on a %i response', async (statusCode) => {
        const service = loadService();
        findByUserIds.mockResolvedValue([subscription('https://push/dead')]);
        sendNotification.mockRejectedValue(gone(statusCode));

        await service.sendToUsers(['u1'], { title: 'hi' });

        expect(deleteByEndpoint).toHaveBeenCalledWith('https://push/dead');
    });

    it('does NOT delete on a transient failure', async () => {
        const service = loadService();
        findByUserIds.mockResolvedValue([subscription('https://push/flaky')]);
        sendNotification.mockRejectedValue(gone(500));

        await service.sendToUsers(['u1'], { title: 'hi' });

        // A 500 is the push service having a bad day, not the user unsubscribing.
        expect(deleteByEndpoint).not.toHaveBeenCalled();
    });

    it('does not delete when the error carries no status code', async () => {
        const service = loadService();
        findByUserIds.mockResolvedValue([subscription('https://push/x')]);
        sendNotification.mockRejectedValue(new Error('network timeout'));

        await service.sendToUsers(['u1'], { title: 'hi' });

        expect(deleteByEndpoint).not.toHaveBeenCalled();
    });

    it('cleans up only the dead endpoints in a mixed batch', async () => {
        const service = loadService();
        findByUserIds.mockResolvedValue([
            subscription('https://push/alive'),
            subscription('https://push/dead')
        ]);
        sendNotification
            .mockResolvedValueOnce({})
            .mockRejectedValueOnce(gone(410));

        await service.sendToUsers(['u1', 'u2'], { title: 'hi' });

        expect(deleteByEndpoint).toHaveBeenCalledTimes(1);
        expect(deleteByEndpoint).toHaveBeenCalledWith('https://push/dead');
    });
});

describe('sendToUser', () => {
    it('delegates to sendToUsers with a single-element list', async () => {
        const service = loadService();
        findByUserIds.mockResolvedValue([subscription('https://push/1')]);
        sendNotification.mockResolvedValue({});

        await service.sendToUser('u1', { title: 'hi' });

        expect(findByUserIds).toHaveBeenCalledWith(['u1']);
        expect(sendNotification).toHaveBeenCalledTimes(1);
    });
});
