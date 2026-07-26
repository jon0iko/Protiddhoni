/**
 * Payment webhook verification and the in-backend simulator.
 *
 * The existing paymentStrategy suite covers processPayment() -- which for the
 * two real providers is a stub returning a hardcoded object. The half that
 * actually makes a security decision, verifyWebhook(), had 1 of 21 branches
 * covered. A webhook is an unauthenticated public endpoint that credits money,
 * so signature verification is the only thing standing behind it.
 *
 * None of this needs a network or a database: it is crypto and branching.
 */

import crypto from 'crypto';
import { SSLCommerzPayment, BkashPayment, SimPayment, PaymentContext } from '../../services/paymentStrategy';

beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('SSLCommerzPayment.verifyWebhook', () => {
    const STORE_PASSWORD = 'store-secret';

    /** Build a payload whose verify_sign is the hash SSLCommerz would send. */
    const signedPayload = (fields: Record<string, string>, storePassword = STORE_PASSWORD) => {
        const verifyKey = Object.keys(fields).join(',');
        let hashString = '';
        for (const key of Object.keys(fields)) {
            hashString += `${key}=${fields[key]}&`;
        }
        hashString += `store_passwd=${storePassword}`;
        const verify_sign = crypto.createHash('md5').update(hashString).digest('hex');
        return { ...fields, verify_key: verifyKey, verify_sign };
    };

    it('accepts a correctly signed payload', () => {
        const strategy = new SSLCommerzPayment();
        const payload = signedPayload({ tran_id: 'TX-1', amount: '250.00', status: 'VALID' });

        expect(strategy.verifyWebhook(payload, {}, STORE_PASSWORD)).toBe(true);
    });

    it('rejects a payload whose amount was tampered with after signing', () => {
        const strategy = new SSLCommerzPayment();
        const payload = signedPayload({ tran_id: 'TX-1', amount: '250.00', status: 'VALID' });

        // The attacker inflates the amount but cannot recompute the hash.
        const tampered = { ...payload, amount: '25000.00' };

        expect(strategy.verifyWebhook(tampered, {}, STORE_PASSWORD)).toBe(false);
    });

    it('rejects when the store password does not match', () => {
        const strategy = new SSLCommerzPayment();
        const payload = signedPayload({ tran_id: 'TX-1', amount: '250.00' });

        expect(strategy.verifyWebhook(payload, {}, 'wrong-store-password')).toBe(false);
    });

    it('rejects a payload with no signature at all', () => {
        const strategy = new SSLCommerzPayment();

        expect(strategy.verifyWebhook({ tran_id: 'TX-1' }, {}, STORE_PASSWORD)).toBe(false);
        expect(strategy.verifyWebhook({}, {}, STORE_PASSWORD)).toBe(false);
    });

    it('rejects a null or undefined payload without throwing', () => {
        const strategy = new SSLCommerzPayment();

        expect(strategy.verifyWebhook(null, {}, STORE_PASSWORD)).toBe(false);
        expect(strategy.verifyWebhook(undefined, {}, STORE_PASSWORD)).toBe(false);
    });

    it('handles a missing verify_key by hashing the store password alone', () => {
        const strategy = new SSLCommerzPayment();
        const hash = crypto.createHash('md5').update(`store_passwd=${STORE_PASSWORD}`).digest('hex');

        expect(strategy.verifyWebhook({ verify_sign: hash }, {}, STORE_PASSWORD)).toBe(true);
        expect(strategy.verifyWebhook({ verify_sign: 'deadbeef' }, {}, STORE_PASSWORD)).toBe(false);
    });

    it('signs over every field named in verify_key, in order', () => {
        const strategy = new SSLCommerzPayment();
        const payload = signedPayload({ a: '1', b: '2', c: '3' });

        expect(strategy.verifyWebhook(payload, {}, STORE_PASSWORD)).toBe(true);

        // Dropping a signed field must invalidate the signature.
        const { b, ...withoutB } = payload as any;
        expect(strategy.verifyWebhook(withoutB, {}, STORE_PASSWORD)).toBe(false);
    });
});

describe('BkashPayment.verifyWebhook', () => {
    const APP_SECRET = 'bkash-app-secret';

    const sign = (payload: any, secret = APP_SECRET) =>
        crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');

    it('accepts a valid HMAC from the x-bkash-signature header', () => {
        const strategy = new BkashPayment();
        const payload = { trxID: 'TX-1', amount: '500' };

        expect(strategy.verifyWebhook(payload, { 'x-bkash-signature': sign(payload) }, APP_SECRET)).toBe(true);
    });

    it('falls back to the authorization header', () => {
        const strategy = new BkashPayment();
        const payload = { trxID: 'TX-1' };

        expect(strategy.verifyWebhook(payload, { authorization: sign(payload) }, APP_SECRET)).toBe(true);
    });

    it('prefers x-bkash-signature when both headers are present', () => {
        const strategy = new BkashPayment();
        const payload = { trxID: 'TX-1' };
        const good = sign(payload);
        const bad = 'f'.repeat(64);

        expect(strategy.verifyWebhook(payload, { 'x-bkash-signature': good, authorization: bad }, APP_SECRET)).toBe(true);
        expect(strategy.verifyWebhook(payload, { 'x-bkash-signature': bad, authorization: good }, APP_SECRET)).toBe(false);
    });

    it('rejects when no signature header is present', () => {
        const strategy = new BkashPayment();

        expect(strategy.verifyWebhook({ trxID: 'TX-1' }, {}, APP_SECRET)).toBe(false);
    });

    it('rejects a signature computed with the wrong secret', () => {
        const strategy = new BkashPayment();
        const payload = { trxID: 'TX-1' };

        const forged = sign(payload, 'attacker-guess');
        expect(strategy.verifyWebhook(payload, { 'x-bkash-signature': forged }, APP_SECRET)).toBe(false);
    });

    it('rejects a tampered payload', () => {
        const strategy = new BkashPayment();
        const original = { trxID: 'TX-1', amount: '500' };
        const signature = sign(original);

        expect(strategy.verifyWebhook({ ...original, amount: '50000' }, { 'x-bkash-signature': signature }, APP_SECRET)).toBe(false);
    });

    it('rejects a wrong-length signature instead of throwing', () => {
        // Regression test. crypto.timingSafeEqual throws RangeError unless the
        // buffers match in length, so before the length guard was added a short
        // or truncated signature produced a 500 rather than a rejection -- the
        // easiest thing in the world for an attacker to send.
        const strategy = new BkashPayment();
        const payload = { trxID: 'TX-1' };

        expect(() => strategy.verifyWebhook(payload, { 'x-bkash-signature': 'short' }, APP_SECRET)).not.toThrow();
        expect(strategy.verifyWebhook(payload, { 'x-bkash-signature': 'short' }, APP_SECRET)).toBe(false);
        expect(strategy.verifyWebhook(payload, { 'x-bkash-signature': 'a'.repeat(128) }, APP_SECRET)).toBe(false);
        expect(strategy.verifyWebhook(payload, { 'x-bkash-signature': '' }, APP_SECRET)).toBe(false);
    });

    it('still rejects a same-length but incorrect signature', () => {
        const strategy = new BkashPayment();
        const payload = { trxID: 'TX-1' };
        const wrongSameLength = 'a'.repeat(64);

        // Confirms the length guard did not become the only check.
        expect(strategy.verifyWebhook(payload, { 'x-bkash-signature': wrongSameLength }, APP_SECRET)).toBe(false);
    });
});

describe('SimPayment -- the in-backend simulator', () => {
    it('succeeds by default with a COMPLETED result', async () => {
        const strategy = new SimPayment();

        const result = await strategy.processPayment(100, { simLatencyMs: 0 });

        expect(result.success).toBe(true);
        expect(result.status).toBe('COMPLETED');
        expect(result.method).toBe('sim');
        expect(result.amount).toBe(100);
        expect(result.transactionId).toMatch(/^SIM_\d+_[A-Z0-9]+$/);
        expect(Number.isNaN(Date.parse(result.processedAt as string))).toBe(false);
    });

    it('forces a failure when simOutcome is "failure"', async () => {
        const strategy = new SimPayment();

        const result = await strategy.processPayment(100, { simLatencyMs: 0, simOutcome: 'failure' });

        expect(result.success).toBe(false);
        expect(result.status).toBe('FAILED');
        expect(result.error).toBe('Simulated payment declined');
        // A failed payment still reports an id so the attempt can be traced.
        expect(result.transactionId).toMatch(/^SIM_/);
    });

    it('simOutcome "success" overrides even a 100% failure rate', async () => {
        const strategy = new SimPayment();

        const result = await strategy.processPayment(100, {
            simLatencyMs: 0, simFailureRate: 1, simOutcome: 'success'
        });

        expect(result.success).toBe(true);
    });

    it('applies simFailureRate when no outcome is forced', async () => {
        const strategy = new SimPayment();

        const alwaysFails = await strategy.processPayment(100, { simLatencyMs: 0, simFailureRate: 1 });
        expect(alwaysFails.success).toBe(false);

        const neverFails = await strategy.processPayment(100, { simLatencyMs: 0, simFailureRate: 0 });
        expect(neverFails.success).toBe(true);
    });

    it('waits for the configured latency', async () => {
        jest.useFakeTimers();
        const strategy = new SimPayment();

        const pending = strategy.processPayment(100, { simLatencyMs: 500 });
        let settled = false;
        void pending.then(() => { settled = true; });

        await Promise.resolve();
        expect(settled).toBe(false);

        jest.advanceTimersByTime(500);
        await pending;
        expect(settled).toBe(true);

        jest.useRealTimers();
    });

    it('skips the timer entirely when latency is zero', async () => {
        jest.useFakeTimers();
        const strategy = new SimPayment();

        // No timer is scheduled, so this resolves without advancing the clock.
        await expect(strategy.processPayment(100, { simLatencyMs: 0 })).resolves.toMatchObject({ success: true });

        jest.useRealTimers();
    });

    it('verifyWebhook always accepts -- there is no real provider to verify', () => {
        expect(new SimPayment().verifyWebhook()).toBe(true);
    });
});

describe('PaymentContext -- strategy delegation', () => {
    it('throws when no strategy has been set', async () => {
        await expect(new PaymentContext().executePayment(100, {})).rejects.toThrow('Payment strategy not set');
    });

    it('delegates to whichever strategy is installed and can be swapped', async () => {
        const context = new PaymentContext();

        context.setStrategy(new SimPayment());
        const sim = await context.executePayment(100, { simLatencyMs: 0 });
        expect(sim.method).toBe('sim');

        context.setStrategy(new SSLCommerzPayment());
        const ssl = await context.executePayment(100, {});
        expect(ssl.method).toBe('sslcommerz');
    });
});
