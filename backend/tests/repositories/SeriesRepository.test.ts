/**
 * SeriesRepository.
 *
 * Shares the pagination shape of ContentRepository but with its own defaults and
 * its own sort whitelist, so the two cannot be tested by proxy for each other --
 * this is the third near-copy of the same clamp arithmetic in the layer.
 *
 * It also records a genuine naming/behaviour mismatch: neither findPublished()
 * nor findPublishedPaginated() applies any published or status filter, unlike
 * their ContentRepository namesakes.
 */

jest.mock('../../config/database');

import SeriesRepository from '../../repositories/SeriesRepository';
import { queryChain, mockDb, useClient, supabaseClient } from '../helpers/supabaseMock';

beforeEach(() => {
    jest.clearAllMocks();
});

async function paginate(filters: Record<string, any> = {}, count: number | null = 100) {
    const chain = queryChain({ data: [], error: null, count });
    useClient(supabaseClient({ tables: { series: chain } }));
    const result = await SeriesRepository.findPublishedPaginated(filters);
    return { result, chain };
}

describe('findPublishedPaginated() -- clamps and defaults', () => {
    it('defaults to page 1, limit 9, sorted by created_at descending', async () => {
        const { result, chain } = await paginate();

        expect(result.pagination).toEqual({ page: 1, limit: 9, total: 100, totalPages: 12 });
        expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
        expect(chain.range).toHaveBeenCalledWith(0, 8);
    });

    it('clamps page and limit at both ends', async () => {
        expect((await paginate({ page: 0 })).result.pagination.page).toBe(1);
        expect((await paginate({ page: 'abc' })).result.pagination.page).toBe(1);
        expect((await paginate({ limit: 999 })).result.pagination.limit).toBe(50);
        expect((await paginate({ limit: 0 })).result.pagination.limit).toBe(9);
        expect((await paginate({ limit: -5 })).result.pagination.limit).toBe(1);
    });

    it('computes the range window from page and limit', async () => {
        const { chain } = await paginate({ page: 4, limit: 5 });
        expect(chain.range).toHaveBeenCalledWith(15, 19);
    });

    it('handles a null count', async () => {
        const { result } = await paginate({}, null);
        expect(result.pagination).toMatchObject({ total: 0, totalPages: 0 });
    });

    it('rounds totalPages up', async () => {
        const { result } = await paginate({ limit: 10 }, 25);
        expect(result.pagination.totalPages).toBe(3);
    });
});

describe('findPublishedPaginated() -- sort whitelist', () => {
    it.each(['created_at', 'updated_at', 'title', 'total_chapters'])(
        'honours the allowed sort column %s',
        async (column) => {
            const { chain } = await paginate({ sort_by: column });
            expect(chain.order).toHaveBeenCalledWith(column, { ascending: false });
        }
    );

    it('rejects a column that is valid for content but not for series', async () => {
        // ContentRepository allows published_at and view_count; series does not.
        // The two whitelists are genuinely different and must not be conflated.
        const { chain } = await paginate({ sort_by: 'view_count' });
        expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });

        const { chain: published } = await paginate({ sort_by: 'published_at' });
        expect(published.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('supports ascending order', async () => {
        const { chain } = await paginate({ order: 'asc', sort_by: 'title' });
        expect(chain.order).toHaveBeenCalledWith('title', { ascending: true });
    });
});

describe('findPublishedPaginated() -- filters', () => {
    it('applies category and author filters when supplied', async () => {
        const { chain } = await paginate({ category_id: 'cat-1', author_id: 'auth-1' });

        expect(chain.eq).toHaveBeenCalledWith('category_id', 'cat-1');
        expect(chain.eq).toHaveBeenCalledWith('author_id', 'auth-1');
    });

    it('KNOWN GAP: applies no published/status filter despite the name', async () => {
        const { chain } = await paginate();

        // ContentRepository.findPublished filters is_published + status; this one
        // filters neither, so unpublished series appear in public listings.
        expect(chain.eq).not.toHaveBeenCalledWith('is_published', expect.anything());
        expect(chain.eq).not.toHaveBeenCalledWith('status', expect.anything());
    });

    it('throws on a query error', async () => {
        mockDb({ tables: { series: { data: null, error: { message: 'boom' } } } });
        await expect(SeriesRepository.findPublishedPaginated({})).rejects.toEqual({ message: 'boom' });
    });
});

describe('findPublished() -- unpaginated listing', () => {
    it('is newest-first and applies no limit by default', async () => {
        const chain = queryChain({ data: [{ id: 's1' }], error: null });
        useClient(supabaseClient({ tables: { series: chain } }));

        await expect(SeriesRepository.findPublished()).resolves.toEqual([{ id: 's1' }]);
        expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
        expect(chain.limit).not.toHaveBeenCalled();
    });

    it('applies optional filters and limit', async () => {
        const chain = queryChain({ data: [], error: null });
        useClient(supabaseClient({ tables: { series: chain } }));

        await SeriesRepository.findPublished({ category_id: 'cat-1', author_id: 'auth-1', limit: 5 });

        expect(chain.eq).toHaveBeenCalledWith('category_id', 'cat-1');
        expect(chain.eq).toHaveBeenCalledWith('author_id', 'auth-1');
        expect(chain.limit).toHaveBeenCalledWith(5);
    });

    it('throws on error', async () => {
        mockDb({ tables: { series: { data: null, error: { message: 'boom' } } } });
        await expect(SeriesRepository.findPublished()).rejects.toEqual({ message: 'boom' });
    });
});

describe('getChapters()', () => {
    it('returns only published chapters in reading order', async () => {
        const chain = queryChain({ data: [{ id: 'c1', chapter_number: 1 }], error: null });
        useClient(supabaseClient({ tables: { content: chain } }));

        await SeriesRepository.getChapters('series-1');

        expect(chain.eq).toHaveBeenCalledWith('series_id', 'series-1');
        // Unlike the series listing itself, this one DOES gate on publication --
        // an unapproved chapter must not be readable from the series page.
        expect(chain.eq).toHaveBeenCalledWith('is_published', true);
        expect(chain.order).toHaveBeenCalledWith('chapter_number', { ascending: true });
    });

    it('throws on error', async () => {
        mockDb({ tables: { content: { data: null, error: { message: 'boom' } } } });
        await expect(SeriesRepository.getChapters('s1')).rejects.toEqual({ message: 'boom' });
    });
});

describe('CRUD', () => {
    it('create inserts and returns the row', async () => {
        const chain = queryChain({ data: { id: 's1', title: 'Nishithini' }, error: null });
        useClient(supabaseClient({ tables: { series: chain } }));

        await expect(SeriesRepository.create({ title: 'Nishithini' })).resolves.toEqual({
            id: 's1', title: 'Nishithini'
        });
        expect(chain.insert).toHaveBeenCalledWith({ title: 'Nishithini' });
    });

    it('update stamps updated_at', async () => {
        const chain = queryChain({ data: { id: 's1' }, error: null });
        useClient(supabaseClient({ tables: { series: chain } }));

        await SeriesRepository.update('s1', { title: 'Renamed' });

        const payload = chain.update.mock.calls[0][0];
        expect(payload.title).toBe('Renamed');
        expect(Number.isNaN(Date.parse(payload.updated_at))).toBe(false);
    });

    it('delete resolves true and throws on error', async () => {
        mockDb({ tables: { series: { data: null, error: null } } });
        await expect(SeriesRepository.delete('s1')).resolves.toBe(true);

        mockDb({ tables: { series: { data: null, error: { message: 'boom' } } } });
        await expect(SeriesRepository.delete('s1')).rejects.toEqual({ message: 'boom' });
    });

    it('findById, findBySlug and findByAuthor filter on the right columns', async () => {
        const byId = queryChain({ data: { id: 's1' }, error: null });
        useClient(supabaseClient({ tables: { series: byId } }));
        await SeriesRepository.findById('s1');
        expect(byId.eq).toHaveBeenCalledWith('id', 's1');

        const bySlug = queryChain({ data: { id: 's1' }, error: null });
        useClient(supabaseClient({ tables: { series: bySlug } }));
        await SeriesRepository.findBySlug('nishithini');
        expect(bySlug.eq).toHaveBeenCalledWith('slug', 'nishithini');

        const byAuthor = queryChain({ data: [], error: null });
        useClient(supabaseClient({ tables: { series: byAuthor } }));
        await SeriesRepository.findByAuthor('auth-1');
        expect(byAuthor.eq).toHaveBeenCalledWith('author_id', 'auth-1');
    });
});
