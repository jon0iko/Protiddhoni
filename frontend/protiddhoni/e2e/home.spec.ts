import { test, expect } from '@playwright/test';
import { mockApi, contentItem } from './helpers';

/**
 * Core journey: a reader lands on the home page and sees the hero + the
 * featured published content (or a clear empty state).
 */
test.describe('Home page', () => {
    test('renders the hero and featured published content', async ({ page }) => {
        await mockApi(page, [
            { match: 'api/content/published', json: { success: true, data: [contentItem()], count: 1 } },
            { match: 'api/series/published', json: { success: true, data: [] } },
        ]);

        await page.goto('/', { waitUntil: 'domcontentloaded' });

        // Hero copy (unique to the landing page).
        await expect(page.getByText('ডিজিটাল আবাসস্থল')).toBeVisible();
        // Featured section heading.
        await expect(page.getByRole('heading', { name: 'সকল রচনা' })).toBeVisible();
        // The mocked story's card is rendered.
        await expect(page.getByRole('heading', { name: 'পরীক্ষা গল্প' })).toBeVisible();
    });

    test('shows the empty state when there is no published content', async ({ page }) => {
        await mockApi(page, [
            { match: 'api/content/published', json: { success: true, data: [], count: 0 } },
            { match: 'api/series/published', json: { success: true, data: [] } },
        ]);

        await page.goto('/', { waitUntil: 'domcontentloaded' });

        await expect(page.getByText('কোন রচনা পাওয়া যায়নি')).toBeVisible();
    });
});
