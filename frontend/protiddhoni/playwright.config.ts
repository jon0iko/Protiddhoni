import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for hermetic e2e tests.
 *
 * The tests drive ONLY the Next.js frontend and stub every backend call
 * (`/api/**`) via page.route (see e2e/helpers.ts), so no backend, Supabase, or
 * seed data is required. The webServer below builds and serves the app on a
 * dedicated port; in CI it always starts fresh, locally it reuses a running one.
 */
export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [['list'], ['html', { open: 'never' }]],

    use: {
        baseURL: 'http://localhost:3100',
        trace: 'on-first-retry',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    webServer: {
        // `test:e2e` runs `next build` first; here we only start the built app.
        command: 'npx next start -p 3100',
        url: 'http://localhost:3100',
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
    },
});
