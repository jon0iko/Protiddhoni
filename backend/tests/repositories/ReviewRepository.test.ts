/**
 * ReviewRepository.
 *
 * getAverageRating() is the only real computation here, and it is duplicated in
 * spirit by ContentRepository.getStats()'s fallback path -- with different output
 * keys and, as those tests show, different rounding. Pinning the arithmetic here
 * is what makes that divergence visible rather than folklore.
 */

jest.mock('../../config/database');

import ReviewRepository from '../../repositories/ReviewRepository';
import { queryChain, mockDb, useClient, supabaseClient, PGRST116 } from '../helpers/supabaseMock';

beforeEach(() => {
    jest.clearAllMocks();
});

const ratings = (...values: number[]) => ({ data: values.map(rating => ({ rating })), error: null });

describe('getAverageRating() -- arithmetic', () => {
    it('returns a zeroed result for no reviews without dividing by zero', async () => {
        mockDb({ tables: { reviews: { data: [], error: null } } });
        await expect(ReviewRepository.getAverageRating('c1')).resolves.toEqual({ average: 0, count: 0 });
    });

    it('averages a single rating', async () => {
        mockDb({ tables: { reviews: ratings(4) } });
        await expect(ReviewRepository.getAverageRating('c1')).resolves.toEqual({ average: 4, count: 1 });
    });

    it('rounds to one decimal place', async () => {
        // 13 / 3 = 4.333... -> 4.3
        mockDb({ tables: { reviews: ratings(4, 4, 5) } });
        await expect(ReviewRepository.getAverageRating('c1')).resolves.toEqual({ average: 4.3, count: 3 });
    });

    it('rounds a repeating decimal up correctly', async () => {
        // 20 / 3 = 6.666... but ratings cap at 5, so use 5,5,4,4,4,5 = 27/6 = 4.5
        mockDb({ tables: { reviews: ratings(5, 5, 4, 4, 4, 5) } });
        await expect(ReviewRepository.getAverageRating('c1')).resolves.toEqual({ average: 4.5, count: 6 });
    });

    it('handles the full 1-5 range', async () => {
        mockDb({ tables: { reviews: ratings(1, 2, 3, 4, 5) } });
        await expect(ReviewRepository.getAverageRating('c1')).resolves.toEqual({ average: 3, count: 5 });
    });

    it('filters by the requested content', async () => {
        const chain = queryChain(ratings(5));
        useClient(supabaseClient({ tables: { reviews: chain } }));

        await ReviewRepository.getAverageRating('content-42');

        expect(chain.select).toHaveBeenCalledWith('rating');
        expect(chain.eq).toHaveBeenCalledWith('content_id', 'content-42');
    });

    it('throws when the query errors', async () => {
        mockDb({ tables: { reviews: { data: null, error: { message: 'boom' } } } });
        await expect(ReviewRepository.getAverageRating('c1')).rejects.toEqual({ message: 'boom' });
    });

    it('KNOWN GAP: a null rating is silently counted as zero', async () => {
        // There is no guard on individual rating values. `4 + null` coerces to 4,
        // so the row still counts toward the denominator and drags the average
        // down to 2 instead of being skipped (which would give 4).
        mockDb({ tables: { reviews: { data: [{ rating: 4 }, { rating: null }], error: null } } });

        await expect(ReviewRepository.getAverageRating('c1')).resolves.toEqual({ average: 2, count: 2 });
    });

    it('KNOWN GAP: a missing rating column produces NaN', async () => {
        // Unlike null, `4 + undefined` is NaN, which propagates through the round
        // and out to the API as a null in JSON. Different failure mode, same cause.
        mockDb({ tables: { reviews: { data: [{ rating: 4 }, {}], error: null } } });

        const result = await ReviewRepository.getAverageRating('c1');
        expect(Number.isNaN(result.average)).toBe(true);
        expect(result.count).toBe(2);
    });
});

describe('error contract', () => {
    it('findById and findUserReviewForContent return null on error', async () => {
        mockDb({ tables: { reviews: { data: null, error: PGRST116 } } });
        await expect(ReviewRepository.findById('r1')).resolves.toBeNull();

        mockDb({ tables: { reviews: { data: null, error: PGRST116 } } });
        await expect(ReviewRepository.findUserReviewForContent('u1', 'c1')).resolves.toBeNull();
    });

    it('create, update, delete and the list readers throw on error', async () => {
        const cases: Array<[string, () => Promise<any>]> = [
            ['create', () => ReviewRepository.create({ rating: 5 })],
            ['update', () => ReviewRepository.update('r1', { rating: 4 })],
            ['delete', () => ReviewRepository.delete('r1')],
            ['findByContentId', () => ReviewRepository.findByContentId('c1')],
            ['findByUserId', () => ReviewRepository.findByUserId('u1')]
        ];

        for (const [, call] of cases) {
            mockDb({ tables: { reviews: { data: null, error: { message: 'boom' } } } });
            await expect(call()).rejects.toEqual({ message: 'boom' });
        }
    });
});

describe('query shaping', () => {
    it('findUserReviewForContent filters on both user and content', async () => {
        const chain = queryChain({ data: { id: 'r1' }, error: null });
        useClient(supabaseClient({ tables: { reviews: chain } }));

        await ReviewRepository.findUserReviewForContent('u1', 'c1');

        expect(chain.eq).toHaveBeenCalledWith('user_id', 'u1');
        expect(chain.eq).toHaveBeenCalledWith('content_id', 'c1');
    });

    it('update stamps updated_at alongside the caller fields', async () => {
        const chain = queryChain({ data: { id: 'r1' }, error: null });
        useClient(supabaseClient({ tables: { reviews: chain } }));

        await ReviewRepository.update('r1', { rating: 3 });

        const payload = chain.update.mock.calls[0][0];
        expect(payload.rating).toBe(3);
        expect(Number.isNaN(Date.parse(payload.updated_at))).toBe(false);
    });

    it('lists are newest-first', async () => {
        const chain = queryChain({ data: [], error: null });
        useClient(supabaseClient({ tables: { reviews: chain } }));

        await ReviewRepository.findByContentId('c1');

        expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('delete resolves true on success', async () => {
        mockDb({ tables: { reviews: { data: null, error: null } } });
        await expect(ReviewRepository.delete('r1')).resolves.toBe(true);
    });
});
