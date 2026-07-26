/**
 * AdminActionLogRepository -- the moderation audit trail.
 *
 * findActiveUnpublish() is the gate that decides whether content can be
 * republished. Its four-predicate query and its PGRST116 handling are the whole
 * behaviour: treating "not found" as an error would break republish entirely,
 * and treating a real error as "not found" would let it silently misfire.
 */

jest.mock('../../config/database');

import AdminActionLogRepository from '../../repositories/AdminActionLogRepository';
import { queryChain, mockDb, useClient, supabaseClient, PGRST116 } from '../helpers/supabaseMock';

beforeEach(() => {
    jest.clearAllMocks();
});

describe('findActiveUnpublish() -- republish gate', () => {
    it('returns the active unpublish row when one exists', async () => {
        const row = { id: 'log-1', action_type: 'unpublish', is_reverted: false };
        mockDb({ tables: { admin_action_log: { data: row, error: null } } });

        await expect(AdminActionLogRepository.findActiveUnpublish('c1')).resolves.toEqual(row);
    });

    it('treats PGRST116 (no row) as null rather than an error', async () => {
        mockDb({ tables: { admin_action_log: { data: null, error: PGRST116 } } });
        await expect(AdminActionLogRepository.findActiveUnpublish('c1')).resolves.toBeNull();
    });

    it('rethrows any other error code', async () => {
        const err = { code: '42501', message: 'permission denied' };
        mockDb({ tables: { admin_action_log: { data: null, error: err } } });

        await expect(AdminActionLogRepository.findActiveUnpublish('c1')).rejects.toEqual(err);
    });

    it('applies all four predicates and takes only the newest row', async () => {
        const chain = queryChain({ data: null, error: PGRST116 });
        useClient(supabaseClient({ tables: { admin_action_log: chain } }));

        await AdminActionLogRepository.findActiveUnpublish('c1');

        expect(chain.eq).toHaveBeenCalledWith('content_id', 'c1');
        expect(chain.eq).toHaveBeenCalledWith('action_type', 'unpublish');
        // Dropping this predicate would make an already-reverted unpublish look active.
        expect(chain.eq).toHaveBeenCalledWith('is_reverted', false);
        expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
        expect(chain.limit).toHaveBeenCalledWith(1);
    });

    it('coerces a falsy data payload to null', async () => {
        mockDb({ tables: { admin_action_log: { data: undefined, error: null } } });
        await expect(AdminActionLogRepository.findActiveUnpublish('c1')).resolves.toBeNull();
    });
});

describe('findAll() -- pagination clamps', () => {
    const runWith = async (args: any) => {
        const chain = queryChain({ data: [], error: null, count: 100 });
        useClient(supabaseClient({ tables: { admin_action_log: chain } }));
        const result = await AdminActionLogRepository.findAll(args);
        return { result, chain };
    };

    it('defaults to page 1, limit 20', async () => {
        const { result, chain } = await runWith(undefined);

        expect(result.pagination).toEqual({ page: 1, limit: 20, total: 100, totalPages: 5 });
        expect(chain.range).toHaveBeenCalledWith(0, 19);
    });

    it('clamps page below 1 up to 1', async () => {
        const { result } = await runWith({ page: 0 });
        expect(result.pagination.page).toBe(1);

        const { result: negative } = await runWith({ page: -5 });
        expect(negative.pagination.page).toBe(1);
    });

    it('falls back to page 1 for a non-numeric page', async () => {
        const { result } = await runWith({ page: 'abc' });
        expect(result.pagination.page).toBe(1);
    });

    it('caps limit at 50', async () => {
        const { result, chain } = await runWith({ limit: 999 });

        expect(result.pagination.limit).toBe(50);
        expect(chain.range).toHaveBeenCalledWith(0, 49);
    });

    it('falls back to limit 20 when limit is 0 or unparseable', async () => {
        const { result: zero } = await runWith({ limit: 0 });
        expect(zero.pagination.limit).toBe(20);

        const { result: junk } = await runWith({ limit: 'abc' });
        expect(junk.pagination.limit).toBe(20);
    });

    it('clamps a negative limit to 1 rather than the default', async () => {
        // parseInt('-5') is -5, which is truthy, so the `|| 20` default does not
        // fire and Math.max(1, -5) wins. Different path from limit: 0.
        const { result } = await runWith({ limit: -5 });
        expect(result.pagination.limit).toBe(1);
    });

    it('computes the range window from page and limit', async () => {
        const { chain } = await runWith({ page: 3, limit: 10 });
        expect(chain.range).toHaveBeenCalledWith(20, 29);
    });

    it('reports zero totals when count is null', async () => {
        const chain = queryChain({ data: null, error: null, count: null });
        useClient(supabaseClient({ tables: { admin_action_log: chain } }));

        const result = await AdminActionLogRepository.findAll({});

        expect(result.data).toEqual([]);
        expect(result.pagination.total).toBe(0);
        expect(result.pagination.totalPages).toBe(0);
    });

    it('rounds totalPages up for a partial final page', async () => {
        const chain = queryChain({ data: [], error: null, count: 21 });
        useClient(supabaseClient({ tables: { admin_action_log: chain } }));

        const result = await AdminActionLogRepository.findAll({ limit: 20 });
        expect(result.pagination.totalPages).toBe(2);
    });

    it('throws on a query error', async () => {
        mockDb({ tables: { admin_action_log: { data: null, error: { message: 'boom' } } } });
        await expect(AdminActionLogRepository.findAll({})).rejects.toEqual({ message: 'boom' });
    });
});

describe('write paths', () => {
    it('markReverted stamps the reverting admin and a timestamp', async () => {
        const chain = queryChain({ data: { id: 'log-1' }, error: null });
        useClient(supabaseClient({ tables: { admin_action_log: chain } }));

        await AdminActionLogRepository.markReverted('log-1', 'admin-9');

        const payload = chain.update.mock.calls[0][0];
        expect(payload.is_reverted).toBe(true);
        expect(payload.reverted_by).toBe('admin-9');
        expect(Number.isNaN(Date.parse(payload.reverted_at))).toBe(false);
        expect(chain.eq).toHaveBeenCalledWith('id', 'log-1');
    });

    it('create inserts the entry verbatim and throws on error', async () => {
        const entry = { admin_id: 'a1', action_type: 'reject', content_id: 'c1', reason: 'off topic' };
        const chain = queryChain({ data: { id: 'log-1' }, error: null });
        useClient(supabaseClient({ tables: { admin_action_log: chain } }));

        await AdminActionLogRepository.create(entry);
        expect(chain.insert).toHaveBeenCalledWith(entry);

        mockDb({ tables: { admin_action_log: { data: null, error: { message: 'boom' } } } });
        await expect(AdminActionLogRepository.create(entry)).rejects.toEqual({ message: 'boom' });
    });

    it('findByContentId returns [] for a null payload and is newest-first', async () => {
        const chain = queryChain({ data: null, error: null });
        useClient(supabaseClient({ tables: { admin_action_log: chain } }));

        await expect(AdminActionLogRepository.findByContentId('c1')).resolves.toEqual([]);
        expect(chain.eq).toHaveBeenCalledWith('content_id', 'c1');
        expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });
});
