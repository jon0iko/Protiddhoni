/**
 * ContentRepository.getStats() -- review aggregation.
 *
 * This method has two paths on purpose. The fast path calls the
 * get_content_review_stats RPC (COUNT + AVG inside Postgres); the fallback
 * re-implements the aggregation in JS so that deploying the code before running
 * optimization_migrations.sql does not break the site.
 *
 * Two things make it worth pinning:
 *
 *  - The guard is `!error && Array.isArray(data)`. An RPC that SUCCEEDS but
 *    returns [] therefore takes the RPC path and yields {0,0}; it does not fall
 *    through. Only an error or a non-array response reaches the fallback.
 *
 *  - The two paths do not round identically. The RPC path returns Number(x)
 *    unrounded; the fallback rounds to one decimal. So the same content can
 *    report a different average depending on whether the migration has been
 *    applied. That divergence is recorded here rather than left as folklore.
 */

jest.mock('../../config/database');

import ContentRepository from '../../repositories/ContentRepository';
import { queryChain, mockDb, useClient, supabaseClient } from '../helpers/supabaseMock';

beforeEach(() => {
    jest.clearAllMocks();
});

const reviewRows = (...values: number[]) => ({ data: values.map(rating => ({ rating })), error: null });

describe('RPC path', () => {
    it('uses the aggregated row when the RPC succeeds', async () => {
        const client = supabaseClient({
            rpc: { get_content_review_stats: { data: [{ total_reviews: 37, average_rating: 4.4 }], error: null } }
        });
        useClient(client);

        await expect(ContentRepository.getStats('c1')).resolves.toEqual({
            totalReviews: 37,
            averageRating: 4.4
        });

        expect(client.rpc).toHaveBeenCalledWith('get_content_review_stats', { p_content_id: 'c1' });
    });

    it('does NOT fall through when the RPC returns an empty array', async () => {
        const client = supabaseClient({
            rpc: { get_content_review_stats: { data: [], error: null } }
            // No `reviews` table registered: if the fallback ran, the mock would throw.
        });
        useClient(client);

        await expect(ContentRepository.getStats('c1')).resolves.toEqual({
            totalReviews: 0,
            averageRating: 0
        });
    });

    it('coerces string numerics and maps null/NaN to zero', async () => {
        mockDb({
            rpc: { get_content_review_stats: { data: [{ total_reviews: '12', average_rating: '3.5' }], error: null } }
        });
        await expect(ContentRepository.getStats('c1')).resolves.toEqual({ totalReviews: 12, averageRating: 3.5 });

        mockDb({
            rpc: { get_content_review_stats: { data: [{ total_reviews: null, average_rating: null }], error: null } }
        });
        await expect(ContentRepository.getStats('c1')).resolves.toEqual({ totalReviews: 0, averageRating: 0 });
    });

    it('does not round on the RPC path', async () => {
        mockDb({
            rpc: {
                get_content_review_stats: {
                    data: [{ total_reviews: 3, average_rating: 4.333333 }],
                    error: null
                }
            }
        });

        // Contrast with the fallback test below, which rounds the same data to 4.3.
        await expect(ContentRepository.getStats('c1')).resolves.toEqual({
            totalReviews: 3,
            averageRating: 4.333333
        });
    });
});

describe('JS fallback path (migration not yet applied)', () => {
    it('falls back and aggregates in JS when the RPC errors', async () => {
        useClient(supabaseClient({
            rpc: { get_content_review_stats: { data: null, error: { code: '42883', message: 'function does not exist' } } },
            tables: { reviews: reviewRows(4, 4, 5) }
        }));

        // 13/3 = 4.333... rounded to 4.3 -- the divergence from the RPC path.
        await expect(ContentRepository.getStats('c1')).resolves.toEqual({
            totalReviews: 3,
            averageRating: 4.3
        });
    });

    it('falls back when the RPC succeeds but returns a non-array', async () => {
        useClient(supabaseClient({
            rpc: { get_content_review_stats: { data: { total_reviews: 5 }, error: null } },
            tables: { reviews: reviewRows(5, 5) }
        }));

        await expect(ContentRepository.getStats('c1')).resolves.toEqual({
            totalReviews: 2,
            averageRating: 5
        });
    });

    it('returns zeros for content with no reviews', async () => {
        useClient(supabaseClient({
            rpc: { get_content_review_stats: { data: null, error: { message: 'missing' } } },
            tables: { reviews: { data: [], error: null } }
        }));

        await expect(ContentRepository.getStats('c1')).resolves.toEqual({
            totalReviews: 0,
            averageRating: 0
        });
    });

    it('queries only the rating column, scoped to the content', async () => {
        const reviews = queryChain(reviewRows(5));
        useClient(supabaseClient({
            rpc: { get_content_review_stats: { data: null, error: { message: 'missing' } } },
            tables: { reviews }
        }));

        await ContentRepository.getStats('content-42');

        expect(reviews.select).toHaveBeenCalledWith('rating');
        expect(reviews.eq).toHaveBeenCalledWith('content_id', 'content-42');
    });

    it('throws when both the RPC and the fallback fail', async () => {
        useClient(supabaseClient({
            rpc: { get_content_review_stats: { data: null, error: { message: 'rpc gone' } } },
            tables: { reviews: { data: null, error: { message: 'table gone' } } }
        }));

        await expect(ContentRepository.getStats('c1')).rejects.toEqual({ message: 'table gone' });
    });
});
