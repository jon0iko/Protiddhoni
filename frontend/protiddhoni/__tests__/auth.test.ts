/**
 * Unit Tests for lib/auth.ts — centralized client-side token/user storage.
 * Runs in jsdom, exercising the real localStorage-backed helpers.
 */

import {
    getAuthToken,
    setAuthToken,
    removeAuthToken,
    getCachedUser,
    setCachedUser,
    isAuthenticated,
    clearAuth,
} from '@/lib/auth';

describe('auth token storage', () => {
    beforeEach(() => localStorage.clear());

    test('stores and reads the auth token', () => {
        expect(getAuthToken()).toBeNull();
        setAuthToken('jwt-abc');
        expect(getAuthToken()).toBe('jwt-abc');
    });

    test('isAuthenticated reflects token presence', () => {
        expect(isAuthenticated()).toBe(false);
        setAuthToken('jwt-abc');
        expect(isAuthenticated()).toBe(true);
    });

    test('removeAuthToken clears both token and cached user', () => {
        setAuthToken('jwt-abc');
        setCachedUser({ id: 'u1' });

        removeAuthToken();

        expect(getAuthToken()).toBeNull();
        expect(getCachedUser()).toBeNull();
    });

    test('clearAuth removes the token', () => {
        setAuthToken('jwt-abc');
        clearAuth();
        expect(getAuthToken()).toBeNull();
    });
});

describe('cached user', () => {
    beforeEach(() => localStorage.clear());

    test('round-trips a user object as JSON', () => {
        setCachedUser({ id: 'u1', username: 'reader' });
        expect(getCachedUser()).toEqual({ id: 'u1', username: 'reader' });
    });

    test('returns null when no user is cached', () => {
        expect(getCachedUser()).toBeNull();
    });

    test('returns null (and does not throw) on corrupt JSON', () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        localStorage.setItem('auth_user', '{not-valid-json');

        expect(getCachedUser()).toBeNull();

        warnSpy.mockRestore();
    });
});
