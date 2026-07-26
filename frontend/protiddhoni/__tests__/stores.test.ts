/**
 * Zustand stores -- authStore and readerStore.
 *
 * Both are plain state containers with no React dependency, so they are driven
 * here through getState()/setState() with no renderer at all.
 *
 * The piece that actually matters is authStore.updateKoriBalance: it is the
 * optimistic update behind the wallet figure in the navbar, so a mistake shows
 * the user a balance they do not have.
 */

import { useAuthStore } from '@/stores/authStore';
import { useReaderStore } from '@/stores/readerStore';

const user = (over: Record<string, any> = {}) => ({
    id: 'u1',
    email: 'rumi@example.com',
    username: 'rumi',
    full_name: 'Rumi Ahmed',
    is_admin: false,
    ...over
});

beforeEach(() => {
    useAuthStore.setState({ user: null, token: null });
    useReaderStore.setState({ theme: 'light', fontSize: 'medium' });
    window.localStorage.clear();
});

describe('authStore', () => {
    it('starts logged out', () => {
        expect(useAuthStore.getState().user).toBeNull();
        expect(useAuthStore.getState().token).toBeNull();
    });

    it('stores the user and token independently', () => {
        useAuthStore.getState().setUser(user());
        expect(useAuthStore.getState().user?.username).toBe('rumi');
        expect(useAuthStore.getState().token).toBeNull();

        useAuthStore.getState().setToken('jwt-abc');
        expect(useAuthStore.getState().token).toBe('jwt-abc');
    });

    it('logout clears both fields together', () => {
        useAuthStore.setState({ user: user(), token: 'jwt-abc' });

        useAuthStore.getState().logout();

        // Leaving either behind would keep the app half-authenticated.
        expect(useAuthStore.getState().user).toBeNull();
        expect(useAuthStore.getState().token).toBeNull();
    });

    describe('updateKoriBalance', () => {
        it('adds to an existing balance', () => {
            useAuthStore.setState({ user: user({ kori_balance: 100 }) });

            useAuthStore.getState().updateKoriBalance(50);

            expect(useAuthStore.getState().user?.kori_balance).toBe(150);
        });

        it('treats an absent balance as zero rather than producing NaN', () => {
            useAuthStore.setState({ user: user() });   // no kori_balance key

            useAuthStore.getState().updateKoriBalance(25);

            expect(useAuthStore.getState().user?.kori_balance).toBe(25);
        });

        it('subtracts on a negative delta, which is how a purchase is applied', () => {
            useAuthStore.setState({ user: user({ kori_balance: 100 }) });

            useAuthStore.getState().updateKoriBalance(-30);

            expect(useAuthStore.getState().user?.kori_balance).toBe(70);
        });

        it('does not resurrect a logged-out user', () => {
            useAuthStore.setState({ user: null });

            useAuthStore.getState().updateKoriBalance(50);

            // Without the null guard this would create a partial user object and
            // the navbar would render a balance for nobody.
            expect(useAuthStore.getState().user).toBeNull();
        });

        it('preserves every other user field', () => {
            useAuthStore.setState({ user: user({ kori_balance: 10, is_admin: true }) });

            useAuthStore.getState().updateKoriBalance(5);

            const updated = useAuthStore.getState().user!;
            expect(updated.kori_balance).toBe(15);
            expect(updated.is_admin).toBe(true);
            expect(updated.username).toBe('rumi');
        });

        it('accumulates across successive updates', () => {
            useAuthStore.setState({ user: user({ kori_balance: 0 }) });

            useAuthStore.getState().updateKoriBalance(10);
            useAuthStore.getState().updateKoriBalance(-4);
            useAuthStore.getState().updateKoriBalance(1);

            expect(useAuthStore.getState().user?.kori_balance).toBe(7);
        });
    });

    it('persists under the auth-storage key so a reload keeps the session', () => {
        useAuthStore.getState().setToken('jwt-abc');

        const persisted = window.localStorage.getItem('auth-storage');
        expect(persisted).toBeTruthy();
        expect(JSON.parse(persisted as string).state.token).toBe('jwt-abc');
    });
});

describe('readerStore', () => {
    it('defaults to the light theme at medium size', () => {
        expect(useReaderStore.getState().theme).toBe('light');
        expect(useReaderStore.getState().fontSize).toBe('medium');
    });

    it.each(['light', 'dark', 'sepia'] as const)('sets the %s theme', (theme) => {
        useReaderStore.getState().setTheme(theme);
        expect(useReaderStore.getState().theme).toBe(theme);
    });

    it.each(['small', 'medium', 'large', 'xlarge'] as const)('sets font size %s', (size) => {
        useReaderStore.getState().setFontSize(size);
        expect(useReaderStore.getState().fontSize).toBe(size);
    });

    it('theme and font size are independent', () => {
        useReaderStore.getState().setTheme('dark');
        useReaderStore.getState().setFontSize('xlarge');

        expect(useReaderStore.getState().theme).toBe('dark');
        expect(useReaderStore.getState().fontSize).toBe('xlarge');
    });

    it('does not persist -- reader settings are per session', () => {
        useReaderStore.getState().setTheme('dark');

        // Unlike authStore, this store has no persist middleware. Recorded so a
        // future "why doesn't my theme stick" is answered by a test, not a hunt.
        expect(window.localStorage.getItem('reader-storage')).toBeNull();
    });
});
