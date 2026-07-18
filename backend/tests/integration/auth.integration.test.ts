/**
 * Integration Tests: Authentication API flow.
 *
 * Drives the REAL Express app (routes -> middleware -> controllers -> JWT/bcrypt)
 * with supertest. Only the data-access layer (UserRepository) is mocked, so these
 * tests exercise request validation, password hashing/verification, token
 * issuance, and the protected-route guard — without touching a database.
 */

// Hermetic env MUST be set before requiring the app. dotenv.config() (called in
// app.js) does not override already-defined vars, so these win over backend/.env.
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.JWT_SECRET = 'integration-test-secret';

// Mock the data-access layer (jest hoists this above the requires below).
jest.mock('../../repositories/UserRepository', () => ({
    create: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByEmailWithPassword: jest.fn(),
    findByUsername: jest.fn(),
    findByUsernameWithPassword: jest.fn(),
    findLegacyUsernameWithPassword: jest.fn(),
    getUserStats: jest.fn()
}));

import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import UserRepository from '../../repositories/UserRepository';
import app from '../../app';

const JWT_SECRET = process.env.JWT_SECRET;

beforeEach(() => {
    jest.clearAllMocks();
    // Controllers/repositories log verbosely; keep test output readable.
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('POST /api/auth/register', () => {
    test('returns 400 when required fields are missing', async () => {
        const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toMatch(/required/i);
        expect(UserRepository.create).not.toHaveBeenCalled();
    });

    test('returns 400 when the email is already registered', async () => {
        (UserRepository.findByEmail as jest.Mock).mockResolvedValue({ id: 'existing-user' });

        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'taken@b.com', username: 'newuser', password: 'Secret123' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Email already registered');
        expect(UserRepository.create).not.toHaveBeenCalled();
    });

    test('returns 400 when the username is already taken', async () => {
        (UserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
        (UserRepository.findByUsername as jest.Mock).mockResolvedValue({ id: 'existing-user' });

        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'fresh@b.com', username: 'takenname', password: 'Secret123' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Username already taken');
    });

    test('creates the user, returns a valid JWT, and never leaks the password hash', async () => {
        (UserRepository.findByEmail as jest.Mock).mockResolvedValue(null);
        (UserRepository.findByUsername as jest.Mock).mockResolvedValue(null);
        (UserRepository.create as jest.Mock).mockImplementation(async (userData) => ({
            id: 'user-1',
            email: userData.email,
            username: userData.username,
            full_name: userData.full_name,
            is_admin: false,
            password_hash: userData.password_hash
        }));

        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'new@b.com', username: 'New User', password: 'Secret123' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.user).toBeDefined();
        expect(res.body.data.user.password_hash).toBeUndefined();

        // The hash the repository was asked to store must actually verify.
        const storedHash = (UserRepository.create as jest.Mock).mock.calls[0][0].password_hash;
        expect(await bcrypt.compare('Secret123', storedHash)).toBe(true);

        // The issued token is signed with our secret and carries the user id.
        const decoded = jwt.verify(res.body.data.token, JWT_SECRET) as any;
        expect(decoded.id).toBe('user-1');
    });
});

describe('POST /api/auth/login', () => {
    test('returns 400 when identifier or password is missing', async () => {
        const res = await request(app).post('/api/auth/login').send({ identifier: 'a@b.com' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/required/i);
    });

    test('returns 401 when the account does not exist', async () => {
        (UserRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue(null);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ identifier: 'ghost@b.com', password: 'whatever1' });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Invalid credentials');
    });

    test('returns 401 when the password is wrong', async () => {
        const password_hash = await bcrypt.hash('correct-password', 10);
        (UserRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue({
            id: 'user-1',
            username: 'reader',
            is_admin: false,
            password_hash
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ identifier: 'user@b.com', password: 'wrong-password' });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Invalid credentials');
    });

    test('logs in with correct credentials and returns a JWT (no hash leaked)', async () => {
        const password_hash = await bcrypt.hash('correct-password', 10);
        (UserRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue({
            id: 'user-1',
            username: 'reader',
            is_admin: false,
            password_hash
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ identifier: 'user@b.com', password: 'correct-password' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.user.password_hash).toBeUndefined();
        const decoded = jwt.verify(res.body.data.token, JWT_SECRET) as any;
        expect(decoded.id).toBe('user-1');
    });
});

describe('GET /api/auth/profile (protected route)', () => {
    test('returns 401 without a token', async () => {
        const res = await request(app).get('/api/auth/profile');

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('No token provided');
    });

    test('returns 401 with an invalid token', async () => {
        const res = await request(app)
            .get('/api/auth/profile')
            .set('Authorization', 'Bearer not-a-valid-token');

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Invalid token');
    });

    test('returns the profile with a valid token', async () => {
        (UserRepository.findById as jest.Mock).mockResolvedValue({ id: 'user-1', username: 'reader', email: 'user@b.com' });
        (UserRepository.getUserStats as jest.Mock).mockResolvedValue({ followers: 3, following: 1 });

        const token = jwt.sign({ id: 'user-1', username: 'reader' }, JWT_SECRET, { expiresIn: '1h' });

        const res = await request(app)
            .get('/api/auth/profile')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe('user-1');
        expect(res.body.data.stats).toEqual({ followers: 3, following: 1 });
    });
});
