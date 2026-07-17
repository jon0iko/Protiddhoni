import { test, expect } from '@playwright/test';
import { mockApi } from './helpers';

/**
 * Core journey: logging in. Covers the happy path (redirect home + token
 * persisted) and a rejected login (error surfaced, stays on the login page).
 */
test.describe('Login journey', () => {
    test('logs in with valid credentials and lands on the home page', async ({ page }) => {
        await mockApi(page, [
            {
                match: 'api/auth/login',
                json: {
                    success: true,
                    data: {
                        token: 'fake-jwt-token',
                        user: { id: 'u1', username: 'reader', full_name: 'পাঠক', email: 'reader@example.com' },
                    },
                },
            },
            { match: 'api/payments/wallet', json: { balance: 100 } },
            { match: 'api/content/published', json: { success: true, data: [], count: 0 } },
            { match: 'api/series/published', json: { success: true, data: [] } },
        ]);

        await page.goto('/login', { waitUntil: 'domcontentloaded' });

        await page.getByPlaceholder('ইমেইল বা ব্যবহারকারী নাম').fill('reader@example.com');
        await page.getByPlaceholder('পাসওয়ার্ড লিখুন').fill('secret123');
        await page.getByRole('button', { name: 'লগইন করুন' }).click();

        // Redirected to home — the hero copy only exists on the landing page.
        await expect(page.getByText('ডিজিটাল আবাসস্থল')).toBeVisible();
        // The auth flow persisted the token.
        await expect
            .poll(() => page.evaluate(() => localStorage.getItem('auth_token')))
            .toBe('fake-jwt-token');
    });

    test('shows an error and stays on the page for invalid credentials', async ({ page }) => {
        await mockApi(page, [
            { match: 'api/auth/login', status: 401, json: { success: false, error: 'Invalid credentials' } },
        ]);

        await page.goto('/login', { waitUntil: 'domcontentloaded' });

        await page.getByPlaceholder('ইমেইল বা ব্যবহারকারী নাম').fill('reader@example.com');
        await page.getByPlaceholder('পাসওয়ার্ড লিখুন').fill('wrong-password');
        await page.getByRole('button', { name: 'লগইন করুন' }).click();

        // Phrase unique to the login error toast (avoids matching the
        // "পাসওয়ার্ড ভুলে গেছেন?" forgot-password link).
        await expect(page.getByText(/আবার চেষ্টা করুন/)).toBeVisible();
        await expect(page).toHaveURL(/\/login/);
    });
});
