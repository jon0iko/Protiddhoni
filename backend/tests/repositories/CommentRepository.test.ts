/**
 * CommentRepository -- threaded comments.
 *
 * The load-bearing behaviour is in findByContentId(): parent comments come back
 * newest-first from the database, but replies are re-sorted oldest-first in JS.
 * That asymmetry is deliberate (a thread reads top-down) and is exactly the kind
 * of thing a refactor "tidies up" into a single sort direction.
 */

jest.mock('../../config/database');

import CommentRepository from '../../repositories/CommentRepository';
import { queryChain, mockDb, useClient, supabaseClient, PGRST116 } from '../helpers/supabaseMock';

beforeEach(() => {
    jest.clearAllMocks();
});

const reply = (id: string, createdAt: string) => ({ id, created_at: createdAt, comment_text: id });

describe('findByContentId() -- thread assembly', () => {
    it('sorts replies oldest-first even when the payload arrives out of order', async () => {
        const parent = {
            id: 'c1',
            created_at: '2026-03-01T00:00:00Z',
            replies: [
                reply('r-late', '2026-03-05T00:00:00Z'),
                reply('r-early', '2026-03-02T00:00:00Z'),
                reply('r-mid', '2026-03-03T00:00:00Z')
            ]
        };
        mockDb({ tables: { comments: { data: [parent], error: null } } });

        const result = await CommentRepository.findByContentId('content-1');

        expect(result[0].replies.map((r: any) => r.id)).toEqual(['r-early', 'r-mid', 'r-late']);
    });

    it('requests only top-level comments, newest first', async () => {
        const chain = queryChain({ data: [], error: null });
        useClient(supabaseClient({ tables: { comments: chain } }));

        await CommentRepository.findByContentId('content-1');

        expect(chain.eq).toHaveBeenCalledWith('content_id', 'content-1');
        // Without this, replies would also surface as parents and be rendered twice.
        expect(chain.is).toHaveBeenCalledWith('parent_comment_id', null);
        // Parents are newest-first; replies (above) are oldest-first. Both matter.
        expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('handles a comment with no replies key and one with an empty array', async () => {
        mockDb({
            tables: {
                comments: {
                    data: [{ id: 'c1', created_at: '2026-03-01T00:00:00Z' }, { id: 'c2', replies: [] }],
                    error: null
                }
            }
        });

        const result = await CommentRepository.findByContentId('content-1');

        expect(result).toHaveLength(2);
        expect(result[0].replies).toBeUndefined();
        expect(result[1].replies).toEqual([]);
    });

    it('returns null without throwing when data is null', async () => {
        mockDb({ tables: { comments: { data: null, error: null } } });
        await expect(CommentRepository.findByContentId('content-1')).resolves.toBeNull();
    });

    it('only sorts one level deep -- nested grandchildren keep their arrival order', async () => {
        const parent = {
            id: 'c1',
            replies: [
                {
                    ...reply('r1', '2026-03-02T00:00:00Z'),
                    replies: [reply('g-late', '2026-03-09T00:00:00Z'), reply('g-early', '2026-03-04T00:00:00Z')]
                }
            ]
        };
        mockDb({ tables: { comments: { data: [parent], error: null } } });

        const result = await CommentRepository.findByContentId('content-1');

        // Documents that the supported nesting depth is 2, not arbitrary.
        expect(result[0].replies[0].replies.map((g: any) => g.id)).toEqual(['g-late', 'g-early']);
    });

    it('throws when the query errors', async () => {
        mockDb({ tables: { comments: { data: null, error: { message: 'boom' } } } });
        await expect(CommentRepository.findByContentId('content-1')).rejects.toEqual({ message: 'boom' });
    });
});

describe('update() -- edit marking', () => {
    it('always stamps is_edited true and updated_at', async () => {
        const chain = queryChain({ data: { id: 'c1' }, error: null });
        useClient(supabaseClient({ tables: { comments: chain } }));

        await CommentRepository.update('c1', { comment_text: 'revised' });

        const payload = chain.update.mock.calls[0][0];
        expect(payload.comment_text).toBe('revised');
        expect(payload.is_edited).toBe(true);
        expect(Number.isNaN(Date.parse(payload.updated_at))).toBe(false);
    });

    it('a caller cannot suppress the edited flag', async () => {
        const chain = queryChain({ data: { id: 'c1' }, error: null });
        useClient(supabaseClient({ tables: { comments: chain } }));

        await CommentRepository.update('c1', { comment_text: 'x', is_edited: false } as any);

        // `...updates` is spread first, so the hardcoded true wins. Pinned because
        // reordering the object literal would silently allow stealth edits.
        expect(chain.update.mock.calls[0][0].is_edited).toBe(true);
    });
});

describe('getCommentCount()', () => {
    it('returns the count and falls back to 0 when null', async () => {
        mockDb({ tables: { comments: { data: null, error: null, count: 42 } } });
        await expect(CommentRepository.getCommentCount('content-1')).resolves.toBe(42);

        mockDb({ tables: { comments: { data: null, error: null, count: null } } });
        await expect(CommentRepository.getCommentCount('content-1')).resolves.toBe(0);
    });

    it('counts replies too, so it does not equal findByContentId().length', async () => {
        const chain = queryChain({ data: null, error: null, count: 5 });
        useClient(supabaseClient({ tables: { comments: chain } }));

        await CommentRepository.getCommentCount('content-1');

        // No parent_comment_id filter here, unlike findByContentId. This is the
        // total-engagement number, not the thread count.
        expect(chain.is).not.toHaveBeenCalled();
        expect(chain.eq).toHaveBeenCalledWith('content_id', 'content-1');
    });

    it('throws on error', async () => {
        mockDb({ tables: { comments: { data: null, error: { message: 'boom' } } } });
        await expect(CommentRepository.getCommentCount('content-1')).rejects.toEqual({ message: 'boom' });
    });
});

describe('remaining accessors', () => {
    it('findById returns null on error but create/delete throw', async () => {
        mockDb({ tables: { comments: { data: null, error: PGRST116 } } });
        await expect(CommentRepository.findById('c1')).resolves.toBeNull();

        mockDb({ tables: { comments: { data: null, error: { message: 'boom' } } } });
        await expect(CommentRepository.create({ comment_text: 'x' })).rejects.toEqual({ message: 'boom' });

        mockDb({ tables: { comments: { data: null, error: null } } });
        await expect(CommentRepository.delete('c1')).resolves.toBe(true);
    });

    it('findReplies fetches children oldest-first', async () => {
        const chain = queryChain({ data: [], error: null });
        useClient(supabaseClient({ tables: { comments: chain } }));

        await CommentRepository.findReplies('c1');

        expect(chain.eq).toHaveBeenCalledWith('parent_comment_id', 'c1');
        expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: true });
    });

    it('findByUserId filters by user and throws on error', async () => {
        const chain = queryChain({ data: [{ id: 'c1' }], error: null });
        useClient(supabaseClient({ tables: { comments: chain } }));

        await expect(CommentRepository.findByUserId('u1')).resolves.toEqual([{ id: 'c1' }]);
        expect(chain.eq).toHaveBeenCalledWith('user_id', 'u1');

        mockDb({ tables: { comments: { data: null, error: { message: 'boom' } } } });
        await expect(CommentRepository.findByUserId('u1')).rejects.toEqual({ message: 'boom' });
    });
});
