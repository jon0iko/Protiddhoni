import type { Page } from '@playwright/test';

/**
 * Helpers for hermetic e2e tests.
 *
 * `mockApi` intercepts every backend call (`/api/**`) and returns canned JSON,
 * so the suite never needs a running backend or database. Any request that
 * isn't explicitly stubbed gets an empty success response, so a stray call can
 * never reach a real network or hang the page.
 */

export type ApiStub = {
    /** Substring of the request URL to match, e.g. 'api/auth/login'. */
    match: string;
    /** HTTP status to return (default 200). */
    status?: number;
    /** JSON body to return. */
    json: unknown;
};

const DEFAULT_JSON = { success: true, data: [], count: 0 };

export async function mockApi(page: Page, stubs: ApiStub[] = []): Promise<void> {
    await page.route('**/api/**', async (route) => {
        const url = route.request().url();
        const stub = stubs.find((s) => url.includes(s.match));
        await route.fulfill({
            status: stub?.status ?? 200,
            contentType: 'application/json',
            body: JSON.stringify(stub?.json ?? DEFAULT_JSON),
        });
    });
}

/** Build a published-content item in the shape the frontend expects. */
export function contentItem(overrides: Record<string, unknown> = {}) {
    return {
        id: 'content-1',
        title: 'পরীক্ষা গল্প',
        slug: 'test-story',
        excerpt: 'একটি পরীক্ষামূলক গল্পের সারাংশ।',
        body: '<p>গল্পের অংশ</p>',
        author: { id: 'author-1', full_name: 'পরীক্ষা লেখক', username: 'lekhok' },
        category: { name: 'গল্প', slug: 'golpo' },
        is_premium: false,
        price: 0,
        view_count: 12,
        published_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        stats: { averageRating: 4.5, totalReviews: 3 },
        ...overrides,
    };
}
