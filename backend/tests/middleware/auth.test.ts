import type { Request, Response, NextFunction } from 'express';
/**
 * Unit Tests for the auth middleware (middleware/auth.js).
 * Verifies JWT enforcement on protected routes and the non-fatal behavior of
 * optionalAuth. Uses a real jsonwebtoken with a fixed test secret.
 */

process.env.JWT_SECRET = 'test-secret-mw';

import jwt from 'jsonwebtoken';
import { authenticate, optionalAuth } from '../../middleware/auth';

const SECRET = process.env.JWT_SECRET;

function mockRes() {
    const res: any = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
}

const signToken = (payload, options = {}) => jwt.sign(payload, SECRET, options);

beforeAll(() => {
    // optionalAuth logs verbose diagnostics; keep test output clean.
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
    jest.restoreAllMocks();
});

describe('authenticate', () => {
    test('rejects a request with no Authorization header', () => {
        const req: any = { headers: {} };
        const res = mockRes();
        const next = jest.fn();

        authenticate(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ success: false, error: 'No token provided' });
    });

    test('rejects a header that is not a Bearer token', () => {
        const req: any = { headers: { authorization: 'Basic abc123' } };
        const res = mockRes();
        const next = jest.fn();

        authenticate(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ success: false, error: 'No token provided' });
    });

    test('accepts a valid token and attaches the decoded user', () => {
        const token = signToken({ id: 'user-1', username: 'reader' });
        const req: any = { headers: { authorization: `Bearer ${token}` } };
        const res = mockRes();
        const next = jest.fn();

        authenticate(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
        expect(req.user).toMatchObject({ id: 'user-1', username: 'reader' });
    });

    test('rejects a malformed/invalid token', () => {
        const req: any = { headers: { authorization: 'Bearer not-a-real-token' } };
        const res = mockRes();
        const next = jest.fn();

        authenticate(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Invalid token' });
    });

    test('rejects an expired token with a specific message', () => {
        const expired = signToken({ id: 'user-1' }, { expiresIn: -10 });
        const req: any = { headers: { authorization: `Bearer ${expired}` } };
        const res = mockRes();
        const next = jest.fn();

        authenticate(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Token expired' });
    });
});

describe('optionalAuth', () => {
    test('continues without a user when no token is provided', () => {
        const req: any = { headers: {} };
        const res = mockRes();
        const next = jest.fn();

        optionalAuth(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.user).toBeUndefined();
        expect(res.status).not.toHaveBeenCalled();
    });

    test('attaches the user when a valid token is provided', () => {
        const token = signToken({ id: 'user-7', username: 'writer' });
        const req: any = { headers: { authorization: `Bearer ${token}` } };
        const res = mockRes();
        const next = jest.fn();

        optionalAuth(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.user).toMatchObject({ id: 'user-7', username: 'writer' });
    });

    test('continues without a user (no error) when the token is invalid', () => {
        const req: any = { headers: { authorization: 'Bearer garbage-token' } };
        const res = mockRes();
        const next = jest.fn();

        optionalAuth(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.user).toBeUndefined();
        expect(res.status).not.toHaveBeenCalled();
    });
});
