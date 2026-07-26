/**
 * errorHandler -- the global error middleware.
 *
 * Seven statements, six branches, and it was at zero coverage. It matters
 * because one of those branches decides whether a stack trace is serialised into
 * the HTTP response: leaking one exposes absolute file paths, dependency
 * versions and internal structure to anyone who can trigger a 500.
 */

jest.mock('../../config/logger', () => ({
    __esModule: true,
    default: { error: jest.fn(), debug: jest.fn(), info: jest.fn(), warn: jest.fn() }
}));

import errorHandler from '../../middleware/errorHandler';
import logger from '../../config/logger';

const mockRes = () => {
    const res: any = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};

const ORIGINAL_ENV = process.env.NODE_ENV;

beforeEach(() => {
    jest.clearAllMocks();
});

afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_ENV;
});

describe('stack trace exposure', () => {
    it('does NOT include the stack outside development', () => {
        process.env.NODE_ENV = 'production';
        const res = mockRes();
        const err: any = new Error('database connection string invalid');
        err.stack = 'Error: ...\n  at /home/azureuser/Protiddhoni/backend/dist/server.js:42';

        errorHandler(err, {} as any, res, jest.fn());

        const body = res.json.mock.calls[0][0];
        expect(body).not.toHaveProperty('stack');
        expect(Object.keys(body)).toEqual(['error']);
    });

    it('does not include the stack when NODE_ENV is unset', () => {
        delete process.env.NODE_ENV;
        const res = mockRes();

        errorHandler(new Error('boom'), {} as any, res, jest.fn());

        expect(res.json.mock.calls[0][0]).not.toHaveProperty('stack');
    });

    it('does not include the stack in test', () => {
        process.env.NODE_ENV = 'test';
        const res = mockRes();

        errorHandler(new Error('boom'), {} as any, res, jest.fn());

        expect(res.json.mock.calls[0][0]).not.toHaveProperty('stack');
    });

    it('DOES include the stack in development, for debugging', () => {
        process.env.NODE_ENV = 'development';
        const res = mockRes();
        const err: any = new Error('boom');
        err.stack = 'Error: boom\n  at somewhere';

        errorHandler(err, {} as any, res, jest.fn());

        expect(res.json.mock.calls[0][0].stack).toBe('Error: boom\n  at somewhere');
    });
});

describe('status and message', () => {
    it('defaults to 500 with a generic message when the error carries neither', () => {
        process.env.NODE_ENV = 'production';
        const res = mockRes();

        errorHandler({} as any, {} as any, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });

    it('honours an explicit statusCode', () => {
        process.env.NODE_ENV = 'production';
        const res = mockRes();
        const err: any = new Error('Not allowed');
        err.statusCode = 403;

        errorHandler(err, {} as any, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'Not allowed' });
    });

    it('logs every error regardless of environment', () => {
        process.env.NODE_ENV = 'production';
        const err = new Error('boom');

        errorHandler(err, {} as any, mockRes(), jest.fn());

        // Suppressing the response body must not also suppress the server log.
        expect(logger.error).toHaveBeenCalledWith('Error:', err);
    });
});
