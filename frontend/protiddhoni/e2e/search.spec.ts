import { test, expect } from '@playwright/test';
import { mockApi, contentItem } from './helpers';

/**
 * Core journey: a reader runs a search and sees matching results (or a clear
 * empty state when nothing matches).
 */
test.describe('Search', () => {
    test('renders results for a query', async ({ page }) => {
        await mockApi(page, [
            {
                match: 'api/content/search',
                json: { success: true, data: [contentItem({ id: 'r1', title: 'পরীক্ষা গল্প', slug: 'result-1' })], count: 1 },
            },
        ]);

        await page.goto('/search?q=test', { waitUntil: 'domcontentloaded' });

        await expect(page.getByRole('heading', { name: 'অনুসন্ধানের ফলাফল' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'পরীক্ষা গল্প' })).toBeVisible();
    });

    test('shows the empty state when nothing matches', async ({ page }) => {
        await mockApi(page, [
            { match: 'api/content/search', json: { success: true, data: [], count: 0 } },
        ]);

        await page.goto('/search?q=zzz', { waitUntil: 'domcontentloaded' });

        await expect(page.getByText('কোনো রচনা পাওয়া যায়নি')).toBeVisible();
    });
});
