/**
 * ContentRepository.findPublishedPaginated() -- the public listing query.
 *
 * Everything asserted here is pure computation over the caller's filters: the
 * page/limit clamps, the sort-column whitelist, and the chapter-exclusion rule.
 * All of it is reachable from a query string, so the clamps are the only thing
 * standing between `?limit=100000` and a full table scan.
 */

jest.mock('../../config/database');

import ContentRepository from '../../repositories/ContentRepository';
import { queryChain, useClient, supabaseClient } from '../helpers/supabaseMock';

beforeEach(() => {
    jest.clearAllMocks();
});

/** Run the method with `filters` and hand back the query chain for assertions. */
async function run(filters: Record<string, any> = {}, count: number | null = 100) {
    const chain = queryChain({ data: [], error: null, count });
    useClient(supabaseClient({ tables: { content: chain } }));
    const result = await ContentRepository.findPublishedPaginated(filters);
    return { result, chain };
}

describe('page clamping', () => {
    it('defaults to page 1 with a window of 9', async () => {
        const { result, chain } = await run();

        expect(result.pagination).toEqual({ page: 1, limit: 9, total: 100, totalPages: 12 });
        expect(chain.range).toHaveBeenCalledWith(0, 8);
    });

    it('clamps page 0 and negative pages up to 1', async () => {
        expect((await run({ page: 0 })).result.pagination.page).toBe(1);
        expect((await run({ page: -5 })).result.pagination.page).toBe(1);
    });

    it('falls back to page 1 for unparseable input', async () => {
        expect((await run({ page: 'abc' })).result.pagination.page).toBe(1);
        expect((await run({ page: null })).result.pagination.page).toBe(1);
    });

    it('accepts a numeric string page', async () => {
        const { result, chain } = await run({ page: '3', limit: 10 });

        expect(result.pagination.page).toBe(3);
        expect(chain.range).toHaveBeenCalledWith(20, 29);
    });
});

describe('limit clamping', () => {
    it('caps the limit at 50 regardless of what the caller asks for', async () => {
        const { result, chain } = await run({ limit: 999 });

        expect(result.pagination.limit).toBe(50);
        expect(chain.range).toHaveBeenCalledWith(0, 49);
    });

    it('falls back to 9 when the limit is 0 or unparseable', async () => {
        // parseInt(0) is 0, which is falsy, so `|| 9` fires.
        expect((await run({ limit: 0 })).result.pagination.limit).toBe(9);
        expect((await run({ limit: 'abc' })).result.pagination.limit).toBe(9);
    });

    it('clamps a negative limit to 1, NOT to the default', async () => {
        // parseInt(-5) is -5, which is truthy, so `|| 9` does not fire and
        // Math.max(1, -5) wins. A genuinely different path from limit: 0.
        expect((await run({ limit: -5 })).result.pagination.limit).toBe(1);
    });

    it('accepts a limit exactly at the cap', async () => {
        expect((await run({ limit: 50 })).result.pagination.limit).toBe(50);
    });
});

describe('totals', () => {
    it('rounds totalPages up for a partial final page', async () => {
        const { result } = await run({ limit: 10 }, 21);
        expect(result.pagination.totalPages).toBe(3);
    });

    it('reports zero totals when count comes back null', async () => {
        const { result } = await run({}, null);

        expect(result.pagination.total).toBe(0);
        expect(result.pagination.totalPages).toBe(0);
    });

    it('is exact when the count divides evenly', async () => {
        const { result } = await run({ limit: 10 }, 30);
        expect(result.pagination.totalPages).toBe(3);
    });
});

describe('sort whitelist', () => {
    it.each(['published_at', 'view_count', 'created_at', 'title'])(
        'honours the allowed sort column %s',
        async (column) => {
            const { chain } = await run({ sort_by: column });
            expect(chain.order).toHaveBeenCalledWith(column, { ascending: false });
        }
    );

    it('silently falls back to published_at for anything else', async () => {
        // The whitelist is what stops an arbitrary query-string value reaching
        // PostgREST as a column name.
        const { chain } = await run({ sort_by: 'password_hash' });
        expect(chain.order).toHaveBeenCalledWith('published_at', { ascending: false });
    });

    it('maps order=asc to ascending and anything else to descending', async () => {
        const asc = await run({ order: 'asc' });
        expect(asc.chain.order).toHaveBeenCalledWith('published_at', { ascending: true });

        const junk = await run({ order: 'sideways' });
        expect(junk.chain.order).toHaveBeenCalledWith('published_at', { ascending: false });
    });
});

describe('chapter exclusion rule', () => {
    it('hides series chapters from the default listing', async () => {
        const { chain } = await run();
        // Without this, every chapter of every serialised novel floods the home page.
        expect(chain.is).toHaveBeenCalledWith('series_id', null);
    });

    it('includes chapters when explicitly requested', async () => {
        const { chain } = await run({ include_chapters: true });
        expect(chain.is).not.toHaveBeenCalled();
    });

    it('does not apply the exclusion when browsing one series', async () => {
        const { chain } = await run({ series_id: 'series-1' });

        expect(chain.is).not.toHaveBeenCalled();
        expect(chain.eq).toHaveBeenCalledWith('series_id', 'series-1');
    });
});

describe('base predicates and optional filters', () => {
    it('always restricts to published + approved content', async () => {
        const { chain } = await run();

        // Both are required: `status` alone would expose unpublished approved work.
        expect(chain.eq).toHaveBeenCalledWith('is_published', true);
        expect(chain.eq).toHaveBeenCalledWith('status', 'approved');
    });

    it('applies each optional filter only when supplied', async () => {
        const { chain } = await run({
            category_id: 'cat-1',
            content_type: 'story',
            author_id: 'auth-1'
        });

        expect(chain.eq).toHaveBeenCalledWith('category_id', 'cat-1');
        expect(chain.eq).toHaveBeenCalledWith('content_type', 'story');
        expect(chain.eq).toHaveBeenCalledWith('author_id', 'auth-1');
    });

    it('omits absent filters entirely', async () => {
        const { chain } = await run();

        expect(chain.eq).not.toHaveBeenCalledWith('category_id', expect.anything());
        expect(chain.eq).not.toHaveBeenCalledWith('is_premium', expect.anything());
    });

    it('treats is_premium: false as a real filter, not an absent one', async () => {
        // The guard is `!== undefined`, so `false` must still filter. A truthiness
        // check here would make "free content only" silently return everything.
        const { chain } = await run({ is_premium: false });
        expect(chain.eq).toHaveBeenCalledWith('is_premium', false);
    });

    it('throws when the query errors', async () => {
        const chain = queryChain({ data: null, error: { message: 'boom' } });
        useClient(supabaseClient({ tables: { content: chain } }));

        await expect(ContentRepository.findPublishedPaginated({})).rejects.toEqual({ message: 'boom' });
    });
});
