/**
 * requireAdmin -- the authorization gate on every admin route.
 *
 * Zero of its six branches were covered. Its defining property is in the header
 * comment of the middleware itself: it re-reads is_admin from the database
 * rather than trusting the JWT, so a token minted before a demotion cannot still
 * grant access. That is only true as long as the DB lookup actually gates the
 * call to next(), which is what this file pins.
 */

// Automocking UserRepository still evaluates the real module to derive its
// shape, which pulls in config/database and throws without Supabase env vars.
// Mocking the database too keeps this suite runnable with no environment at all.
jest.mock('../../config/database');
jest.mock('../../repositories/UserRepository');

import { requireAdmin } from '../../middleware/adminAuth';
import UserRepository from '../../repositories/UserRepository';

const findById = UserRepository.findById as jest.Mock;

const mockRes = () => {
    const res: any = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    (console.error as jest.Mock).mockRestore?.();
});

describe('authentication precondition', () => {
    it('401s when there is no authenticated user', async () => {
        const res = mockRes();
        const next = jest.fn();

        await requireAdmin({} as any, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Authentication required' });
        expect(next).not.toHaveBeenCalled();
        expect(findById).not.toHaveBeenCalled();
    });

    it('401s when the user object carries no id', async () => {
        const res = mockRes();
        const next = jest.fn();

        await requireAdmin({ user: { username: 'x' } } as any, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
});

describe('database re-verification', () => {
    it('403s when the database says the user is not an admin', async () => {
        findById.mockResolvedValue({ id: 'u1', is_admin: false });
        const res = mockRes();
        const next = jest.fn();

        // The JWT claims admin; the database disagrees and must win.
        await requireAdmin({ user: { id: 'u1', is_admin: true } } as any, res, next);

        expect(findById).toHaveBeenCalledWith('u1');
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Admin access required' });
        expect(next).not.toHaveBeenCalled();
    });

    it('403s when the user no longer exists', async () => {
        findById.mockResolvedValue(null);
        const res = mockRes();
        const next = jest.fn();

        await requireAdmin({ user: { id: 'deleted-user' } } as any, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('calls next() and marks the request when the database confirms admin', async () => {
        findById.mockResolvedValue({ id: 'u1', is_admin: true });
        const req: any = { user: { id: 'u1' } };
        const res = mockRes();
        const next = jest.fn();

        await requireAdmin(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.user.is_admin).toBe(true);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('does not trust a JWT that merely claims is_admin', async () => {
        findById.mockResolvedValue({ id: 'u1', is_admin: false });
        const res = mockRes();
        const next = jest.fn();

        await requireAdmin({ user: { id: 'u1', is_admin: true } } as any, res, next);

        // If this ever short-circuits on the token, a stolen or stale token
        // becomes a permanent admin credential.
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });
});

describe('failure handling', () => {
    it('500s and denies access when the lookup throws -- it fails closed', async () => {
        findById.mockRejectedValue(new Error('db down'));
        const res = mockRes();
        const next = jest.fn();

        await requireAdmin({ user: { id: 'u1' } } as any, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false, error: 'Failed to verify admin privileges'
        });
        // The important half: a database outage must not become an open door.
        expect(next).not.toHaveBeenCalled();
    });
});
