/**
 * RatingRepository.
 *
 * The dual unique-constraint design (one rating per logged-in user, one per
 * anonymous identifier) is enforced in Postgres, so most of this file is thin
 * RPC delegation. The one piece of JS-side branching is hasUserRated(), where
 * the precedence between user_id and user_identifier lives -- get that backwards
 * and an anonymous identifier could be used to read a logged-in user's state.
 *
 * NOTE: this suite is only possible because the module-scope
 * `const supabase = db.getClient()` was replaced with a per-call getter. It was
 * the only one of the fourteen repositories that captured the client at import.
 */

jest.mock('../../config/database');

import RatingRepository from '../../repositories/RatingRepository';
import { queryChain, mockDb, useClient, supabaseClient } from '../helpers/supabaseMock';

beforeEach(() => {
    jest.clearAllMocks();
});

describe('hasUserRated() -- identifier precedence', () => {
    it('filters by user_id for a logged-in user', async () => {
        const chain = queryChain({ data: [{ id: 'r1' }], error: null });
        useClient(supabaseClient({ tables: { ratings: chain } }));

        await expect(RatingRepository.hasUserRated('c1', 'user-1', undefined)).resolves.toBe(true);

        expect(chain.eq).toHaveBeenCalledWith('content_id', 'c1');
        expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
        expect(chain.eq).not.toHaveBeenCalledWith('user_identifier', expect.anything());
    });

    it('falls back to user_identifier for an anonymous visitor', async () => {
        const chain = queryChain({ data: [{ id: 'r1' }], error: null });
        useClient(supabaseClient({ tables: { ratings: chain } }));

        await expect(RatingRepository.hasUserRated('c1', null, 'session-abc')).resolves.toBe(true);

        expect(chain.eq).toHaveBeenCalledWith('user_identifier', 'session-abc');
        expect(chain.eq).not.toHaveBeenCalledWith('user_id', expect.anything());
    });

    it('user_id WINS when both are supplied', async () => {
        const chain = queryChain({ data: [], error: null });
        useClient(supabaseClient({ tables: { ratings: chain } }));

        await RatingRepository.hasUserRated('c1', 'user-1', 'session-abc');

        // This is the crux of the dual-constraint design: a logged-in user is
        // never matched by their pre-login anonymous identifier.
        expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
        expect(chain.eq).not.toHaveBeenCalledWith('user_identifier', 'session-abc');
    });

    it('returns false when neither identifier is supplied', async () => {
        // Note: the builder is constructed before the guard, so this asserts the
        // return value only -- "no query was built" would be a false claim.
        mockDb({ tables: { ratings: { data: [{ id: 'r1' }], error: null } } });

        await expect(RatingRepository.hasUserRated('c1', null, null)).resolves.toBe(false);
        await expect(RatingRepository.hasUserRated('c1', undefined, undefined)).resolves.toBe(false);
    });

    it('is false for an empty result and throws on a query error', async () => {
        mockDb({ tables: { ratings: { data: [], error: null } } });
        await expect(RatingRepository.hasUserRated('c1', 'user-1', null)).resolves.toBe(false);

        mockDb({ tables: { ratings: { data: null, error: { message: 'boom' } } } });
        await expect(RatingRepository.hasUserRated('c1', 'user-1', null)).rejects.toEqual({ message: 'boom' });
    });
});

describe('RPC delegation -- null coercion of optional identifiers', () => {
    it('upsert passes explicit nulls rather than undefined', async () => {
        const client = supabaseClient({
            rpc: { upsert_rating: { data: [{ success: true, average_rating: 4.2, rating_count: 5 }], error: null } }
        });
        useClient(client);

        const result = await RatingRepository.upsert({ content_id: 'c1', rating: 5 });

        expect(client.rpc).toHaveBeenCalledWith('upsert_rating', {
            p_content_id: 'c1',
            p_user_id: null,
            p_user_identifier: null,
            p_rating: 5
        });
        expect(result).toEqual({ success: true, average_rating: 4.2, rating_count: 5 });
    });

    it('upsert forwards both identifiers when present', async () => {
        const client = supabaseClient({ rpc: { upsert_rating: { data: [{ success: true }], error: null } } });
        useClient(client);

        await RatingRepository.upsert({
            content_id: 'c1', user_id: 'u1', user_identifier: 'sess', rating: 3
        });

        expect(client.rpc).toHaveBeenCalledWith('upsert_rating', {
            p_content_id: 'c1', p_user_id: 'u1', p_user_identifier: 'sess', p_rating: 3
        });
    });

    it('findUserRating unwraps the first row and defaults to null', async () => {
        mockDb({ rpc: { get_user_rating: { data: [{ rating: 4 }], error: null } } });
        await expect(RatingRepository.findUserRating('c1', 'u1', null)).resolves.toBe(4);

        mockDb({ rpc: { get_user_rating: { data: [], error: null } } });
        await expect(RatingRepository.findUserRating('c1', 'u1', null)).resolves.toBeNull();
    });

    it('getStats defaults to a zeroed shape for an empty result', async () => {
        mockDb({ rpc: { get_content_rating_stats: { data: [], error: null } } });

        await expect(RatingRepository.getStats('c1')).resolves.toEqual({
            average_rating: 0, rating_count: 0
        });
    });

    it('getStats returns the row when present', async () => {
        mockDb({ rpc: { get_content_rating_stats: { data: [{ average_rating: 4.4, rating_count: 37 }], error: null } } });

        await expect(RatingRepository.getStats('c1')).resolves.toEqual({
            average_rating: 4.4, rating_count: 37
        });
    });

    it('all three RPC wrappers rethrow errors', async () => {
        const err = { message: 'rpc failed' };

        mockDb({ rpc: { upsert_rating: { data: null, error: err } } });
        await expect(RatingRepository.upsert({ content_id: 'c1', rating: 5 })).rejects.toEqual(err);

        mockDb({ rpc: { get_user_rating: { data: null, error: err } } });
        await expect(RatingRepository.findUserRating('c1', 'u1', null)).rejects.toEqual(err);

        mockDb({ rpc: { get_content_rating_stats: { data: null, error: err } } });
        await expect(RatingRepository.getStats('c1')).rejects.toEqual(err);
    });

    it('KNOWN GAP: upsert and findUserRating crash on a null RPC payload', async () => {
        // getStats guards with `data[0] || {...}`; these two do not, so a void
        // RPC result throws a TypeError instead of surfacing a clean error.
        mockDb({ rpc: { upsert_rating: { data: null, error: null } } });
        await expect(RatingRepository.upsert({ content_id: 'c1', rating: 5 })).rejects.toThrow(TypeError);

        mockDb({ rpc: { get_user_rating: { data: null, error: null } } });
        await expect(RatingRepository.findUserRating('c1', 'u1', null)).rejects.toThrow(TypeError);
    });
});

describe('direct table access', () => {
    it('findByContentId and findByUserId are newest-first and filter correctly', async () => {
        const byContent = queryChain({ data: [{ id: 'r1' }], error: null });
        useClient(supabaseClient({ tables: { ratings: byContent } }));

        await expect(RatingRepository.findByContentId('c1')).resolves.toEqual([{ id: 'r1' }]);
        expect(byContent.eq).toHaveBeenCalledWith('content_id', 'c1');
        expect(byContent.order).toHaveBeenCalledWith('created_at', { ascending: false });

        const byUser = queryChain({ data: [{ id: 'r2' }], error: null });
        useClient(supabaseClient({ tables: { ratings: byUser } }));

        await RatingRepository.findByUserId('u1');
        expect(byUser.eq).toHaveBeenCalledWith('user_id', 'u1');
    });

    it('delete resolves true and throws on error', async () => {
        const chain = queryChain({ data: null, error: null });
        useClient(supabaseClient({ tables: { ratings: chain } }));

        await expect(RatingRepository.delete('r1')).resolves.toBe(true);
        expect(chain.eq).toHaveBeenCalledWith('id', 'r1');

        mockDb({ tables: { ratings: { data: null, error: { message: 'boom' } } } });
        await expect(RatingRepository.delete('r1')).rejects.toEqual({ message: 'boom' });
    });

    it('both list readers throw on error', async () => {
        mockDb({ tables: { ratings: { data: null, error: { message: 'boom' } } } });
        await expect(RatingRepository.findByContentId('c1')).rejects.toEqual({ message: 'boom' });

        mockDb({ tables: { ratings: { data: null, error: { message: 'boom' } } } });
        await expect(RatingRepository.findByUserId('u1')).rejects.toEqual({ message: 'boom' });
    });
});
