/**
 * Integration Tests: the published API documentation.
 *
 * The report and the submission both cite a public docs URL, so "the docs are
 * live" is a promise the deployment has to keep. These tests drive the real
 * Express app and assert that promise, catching the three ways it has actually
 * broken in practice:
 *
 *   1. The OpenAPI file not being found at runtime (__dirname differs between
 *      running the TypeScript sources and the compiled output in dist/).
 *   2. helmet's Content-Security-Policy blocking Swagger UI's assets, which
 *      renders a blank page while still returning HTTP 200.
 *   3. The spec silently losing endpoints.
 */

process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.JWT_SECRET = 'integration-test-secret';

import request from 'supertest';
import app from '../../app';

describe('GET /api-docs.json -- the raw OpenAPI document', () => {
    it('is served as JSON', async () => {
        const res = await request(app).get('/api-docs.json');

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/application\/json/);
    });

    it('is a valid OpenAPI 3 document with both servers declared', async () => {
        const { body } = await request(app).get('/api-docs.json');

        expect(body.openapi).toMatch(/^3\./);
        expect(body.info.title).toBe('Protiddhoni API');
        expect(body.servers.map((s: any) => s.url)).toEqual(
            expect.arrayContaining(['https://protiddhoni.farefin.com', 'http://localhost:5000'])
        );
    });

    it('declares bearer JWT as the security scheme', async () => {
        const { body } = await request(app).get('/api-docs.json');

        expect(body.components.securitySchemes.bearerAuth).toMatchObject({
            type: 'http', scheme: 'bearer', bearerFormat: 'JWT'
        });
    });

    it('documents the whole API surface, not a fragment of it', async () => {
        const { body } = await request(app).get('/api-docs.json');

        const operations = Object.values(body.paths).reduce(
            (n: number, item: any) =>
                n + Object.keys(item).filter(k => ['get', 'post', 'put', 'patch', 'delete'].includes(k)).length,
            0
        );

        // Guards against the spec quietly falling out of step with the routes.
        expect(Object.keys(body.paths).length).toBeGreaterThanOrEqual(100);
        expect(operations).toBeGreaterThanOrEqual(120);
    });

    it('covers a representative endpoint from every major area', async () => {
        const { body } = await request(app).get('/api-docs.json');

        const expected: Array<[string, string]> = [
            ['/api/auth/login', 'post'],
            ['/api/content/published', 'get'],
            ['/api/content/{id}/approve', 'post'],
            ['/api/series/published', 'get'],
            ['/api/users/{username}', 'get'],
            ['/api/comments', 'post'],
            ['/api/payments/wallet', 'get'],
            ['/api/payments/tip/{authorId}', 'post'],
            ['/api/purchases/{contentId}', 'post'],
            ['/api/notifications/unread-count', 'get'],
            ['/api/push/vapid-public-key', 'get'],
            ['/api/quizzes/leaderboard', 'get'],
            ['/api/reports', 'post']
        ];

        for (const [route, method] of expected) {
            expect(body.paths[route]?.[method]).toBeDefined();
        }
    });

    it('every operation carries a tag and a summary', async () => {
        const { body } = await request(app).get('/api-docs.json');

        for (const [route, item] of Object.entries<any>(body.paths)) {
            for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
                const op = item[method];
                if (!op) continue;
                expect(`${method} ${route} tags`).toBe(`${method} ${route} tags`);
                expect(Array.isArray(op.tags) && op.tags.length > 0).toBe(true);
                expect(typeof op.summary === 'string' && op.summary.length > 0).toBe(true);
            }
        }
    });

    it('marks public endpoints as requiring no credentials', async () => {
        const { body } = await request(app).get('/api-docs.json');

        // A reader must be able to browse without an account; if these ever
        // require auth in the docs, either the docs or the API has drifted.
        expect(body.paths['/api/content/published'].get.security).toEqual([]);
        expect(body.paths['/api/auth/login'].post.security).toEqual([]);
    });

    it('marks protected and admin endpoints as requiring a bearer token', async () => {
        const { body } = await request(app).get('/api-docs.json');

        expect(body.paths['/api/payments/wallet'].get.security).toEqual([{ bearerAuth: [] }]);

        const approve = body.paths['/api/content/{id}/approve'].post;
        expect(approve.security).toEqual([{ bearerAuth: [] }]);
        expect(approve.description).toMatch(/administrator/i);
    });

    it('declares a path parameter for every templated segment', async () => {
        const { body } = await request(app).get('/api-docs.json');

        for (const [route, item] of Object.entries<any>(body.paths)) {
            const templated = [...route.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
            if (!templated.length) continue;
            const declared = (item.parameters ?? []).map((p: any) => p.name);
            expect(declared.sort()).toEqual(templated.sort());
        }
    });
});

describe('GET /api-docs -- the Swagger UI page', () => {
    it('serves an HTML page', async () => {
        const res = await request(app).get('/api-docs/');

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/text\/html/);
        expect(res.text).toMatch(/swagger-ui/);
    });

    it('sends a CSP that permits Swagger UI to bootstrap', async () => {
        const res = await request(app).get('/api-docs/');
        const csp = res.headers['content-security-policy'];

        // The global CSP uses `script-src 'self'`, which blocks Swagger UI's
        // inline bootstrap and renders a blank page on a healthy 200. The docs
        // mount overwrites it with a policy that allows the inline script.
        expect(csp).toBeDefined();
        expect(csp).toMatch(/script-src [^;]*'unsafe-inline'/);
    });

    it('still ships a restrictive CSP on the docs page itself', async () => {
        const csp = (await request(app).get('/api-docs/')).headers['content-security-policy'];

        // Relaxing the script directive must not turn into having no policy.
        expect(csp).toMatch(/default-src 'self'/);
        expect(csp).toMatch(/object-src 'none'/);
    });

    it('leaves the stricter policy in place everywhere else', async () => {
        const res = await request(app).get('/health');

        expect(res.headers['x-content-type-options']).toBe('nosniff');
        // The API's own CSP must NOT have inherited the docs relaxation.
        expect(res.headers['content-security-policy']).not.toMatch(/script-src [^;]*'unsafe-inline'/);
    });

    it('is outside the /api rate limiter, so reading docs cannot exhaust a quota', async () => {
        const res = await request(app).get('/api-docs/');

        // Express only treats a mount path as a prefix at a `/` boundary, so
        // app.use('/api', limiter) does not match '/api-docs'.
        expect(res.headers['ratelimit-limit']).toBeUndefined();
    });
});
