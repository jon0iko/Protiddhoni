/**
 * ContentRepository.incrementViewCountWithSession() -- de-duplicated view counts.
 *
 * View counts were once incremented on every page load, which made them useless
 * as a signal for writers (bug B-06). The fix counts a content/session pair at
 * most once, via an RPC with a table-level unique-constraint fallback.
 *
 * The property that actually matters is the negative one: when the session has
 * already been counted, the fallback must NOT call incrementViewCount. That is
 * the whole point of the method, and it is the assertion most likely to catch a
 * regression, so it is tested from both directions.
 */

jest.mock('../../config/database');
jest.mock('../../config/logger', () => ({
    __esModule: true,
    default: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() }
}));

import ContentRepository from '../../repositories/ContentRepository';
import { queryChain, useClient, supabaseClient } from '../helpers/supabaseMock';

const RPC_FAILED = { code: '42883', message: 'function increment_view_count_once does not exist' };

beforeEach(() => {
    jest.clearAllMocks();
});

describe('RPC path', () => {
    it('returns the RPC verdict and does not touch the fallback table', async () => {
        const client = supabaseClient({
            rpc: { increment_view_count_once: { data: true, error: null } }
            // No content_view_sessions registered -- using the fallback would throw.
        });
        useClient(client);

        await expect(ContentRepository.incrementViewCountWithSession('c1', 'sess-1', 'viewer-1'))
            .resolves.toBe(true);

        expect(client.rpc).toHaveBeenCalledWith('increment_view_count_once', {
            p_content_id: 'c1',
            p_session_key: 'sess-1',
            p_viewer_key: 'viewer-1'
        });
    });

    it('returns false when the RPC says this session was already counted', async () => {
        useClient(supabaseClient({ rpc: { increment_view_count_once: { data: false, error: null } } }));

        await expect(ContentRepository.incrementViewCountWithSession('c1', 'sess-1', 'viewer-1'))
            .resolves.toBe(false);
    });
});

describe('table fallback (RPC unavailable)', () => {
    it('counts the view and increments when the upsert inserts a new row', async () => {
        const sessions = queryChain({ data: [{ id: 'view-1' }], error: null });
        const client = supabaseClient({
            rpc: {
                increment_view_count_once: { data: null, error: RPC_FAILED },
                increment_view_count: { data: 43, error: null }
            },
            tables: { content_view_sessions: sessions }
        });
        useClient(client);

        await expect(ContentRepository.incrementViewCountWithSession('c1', 'sess-1', 'viewer-1'))
            .resolves.toBe(true);

        expect(client.rpc).toHaveBeenCalledWith('increment_view_count', { content_id: 'c1' });
    });

    it('DOES NOT increment when the session was already recorded', async () => {
        // ignoreDuplicates makes the upsert return [] for a duplicate. If this
        // ever increments, every refresh inflates the count again -- the exact
        // bug this method was written to fix.
        const sessions = queryChain({ data: [], error: null });
        const client = supabaseClient({
            rpc: {
                increment_view_count_once: { data: null, error: RPC_FAILED },
                increment_view_count: { data: 1, error: null }
            },
            tables: { content_view_sessions: sessions }
        });
        useClient(client);

        await expect(ContentRepository.incrementViewCountWithSession('c1', 'sess-1', 'viewer-1'))
            .resolves.toBe(false);

        expect(client.rpc).not.toHaveBeenCalledWith('increment_view_count', expect.anything());
    });

    it('upserts on the content/session pair with duplicates ignored', async () => {
        const sessions = queryChain({ data: [], error: null });
        useClient(supabaseClient({
            rpc: { increment_view_count_once: { data: null, error: RPC_FAILED } },
            tables: { content_view_sessions: sessions }
        }));

        await ContentRepository.incrementViewCountWithSession('c1', 'sess-1', 'viewer-1');

        expect(sessions.upsert).toHaveBeenCalledWith(
            { content_id: 'c1', session_key: 'sess-1', viewer_key: 'viewer-1' },
            { onConflict: 'content_id,session_key', ignoreDuplicates: true }
        );
    });

    it('returns false and skips the increment when the fallback upsert errors', async () => {
        const client = supabaseClient({
            rpc: {
                increment_view_count_once: { data: null, error: RPC_FAILED },
                increment_view_count: { data: 1, error: null }
            },
            tables: { content_view_sessions: { data: null, error: { message: 'insert failed' } } }
        });
        useClient(client);

        await expect(ContentRepository.incrementViewCountWithSession('c1', 'sess-1', 'viewer-1'))
            .resolves.toBe(false);

        expect(client.rpc).not.toHaveBeenCalledWith('increment_view_count', expect.anything());
    });

    it('treats a non-array upsert payload as not counted', async () => {
        const client = supabaseClient({
            rpc: {
                increment_view_count_once: { data: null, error: RPC_FAILED },
                increment_view_count: { data: 1, error: null }
            },
            tables: { content_view_sessions: { data: null, error: null } }
        });
        useClient(client);

        await expect(ContentRepository.incrementViewCountWithSession('c1', 'sess-1', 'viewer-1'))
            .resolves.toBe(false);
        expect(client.rpc).not.toHaveBeenCalledWith('increment_view_count', expect.anything());
    });

    it('survives undefined session and viewer keys without throwing', async () => {
        // The logger previews these with `?.slice(0, 12)`; a plain .slice would
        // throw here and take down a page render over a telemetry detail.
        useClient(supabaseClient({
            rpc: { increment_view_count_once: { data: null, error: RPC_FAILED } },
            tables: { content_view_sessions: { data: [], error: null } }
        }));

        await expect(ContentRepository.incrementViewCountWithSession('c1', undefined, undefined))
            .resolves.toBe(false);
    });
});

describe('incrementViewCount() -- unconditional bump', () => {
    it('returns the RPC payload', async () => {
        const client = supabaseClient({ rpc: { increment_view_count: { data: 12, error: null } } });
        useClient(client);

        await expect(ContentRepository.incrementViewCount('c1')).resolves.toBe(12);
        expect(client.rpc).toHaveBeenCalledWith('increment_view_count', { content_id: 'c1' });
    });

    it('swallows errors rather than failing the page render', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        useClient(supabaseClient({ rpc: { increment_view_count: { data: null, error: { message: 'boom' } } } }));

        // A telemetry failure must not surface as a 500 on a read.
        await expect(ContentRepository.incrementViewCount('c1')).resolves.toBeNull();
        (console.error as jest.Mock).mockRestore();
    });
});
