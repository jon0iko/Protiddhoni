/**
 * ReportRepository -- user reports of published content.
 *
 * Arrived on main with the content-moderation feature, untested. Two things
 * here are worth pinning rather than waiving:
 *
 *  - findPendingGroupedByContent() does a two-query join and then groups and
 *    sorts entirely in JS. It is the only real computation in the file and it
 *    drives the admin moderation queue's ordering.
 *
 *  - checkPendingByUser() is what stops one user filing the same report
 *    repeatedly, so its PGRST116 handling decides between "no duplicate" and a
 *    hard failure.
 */

jest.mock('../../config/database');

import ReportRepository from '../../repositories/ReportRepository';
import { queryChain, mockDb, useClient, supabaseClient, PGRST116 } from '../helpers/supabaseMock';

beforeEach(() => {
    jest.clearAllMocks();
});

const report = (id: string, contentId: string, createdAt: string) => ({
    id,
    content_id: contentId,
    created_at: createdAt,
    status: 'pending',
    reporter: { id: `u-${id}`, username: `user-${id}` }
});

describe('create()', () => {
    it('inserts the report and returns the row', async () => {
        const chain = queryChain({ data: { id: 'r1' }, error: null });
        useClient(supabaseClient({ tables: { content_reports: chain } }));

        const payload = {
            reporter_id: 'u1',
            content_id: 'c1',
            reason_category: 'plagiarism',
            reason_details: 'copied from elsewhere'
        };

        await expect(ReportRepository.create(payload)).resolves.toEqual({ id: 'r1' });
        expect(chain.insert).toHaveBeenCalledWith(payload);
    });

    it('throws on error', async () => {
        mockDb({ tables: { content_reports: { data: null, error: { message: 'boom' } } } });

        await expect(ReportRepository.create({
            reporter_id: 'u1', content_id: 'c1', reason_category: 'spam'
        })).rejects.toEqual({ message: 'boom' });
    });
});

describe('checkPendingByUser() -- duplicate guard', () => {
    it('returns the existing row when the user already has a pending report', async () => {
        mockDb({ tables: { content_reports: { data: { id: 'r1' }, error: null } } });

        await expect(ReportRepository.checkPendingByUser('u1', 'c1')).resolves.toEqual({ id: 'r1' });
    });

    it('returns null when there is no pending report', async () => {
        // PGRST116 is "no row", which is the normal case and must not throw --
        // otherwise every first-time report would 500.
        mockDb({ tables: { content_reports: { data: null, error: PGRST116 } } });

        await expect(ReportRepository.checkPendingByUser('u1', 'c1')).resolves.toBeNull();
    });

    it('rethrows any other error', async () => {
        const err = { code: '42501', message: 'permission denied' };
        mockDb({ tables: { content_reports: { data: null, error: err } } });

        await expect(ReportRepository.checkPendingByUser('u1', 'c1')).rejects.toEqual(err);
    });

    it('scopes to this reporter, this content, and pending only', async () => {
        const chain = queryChain({ data: null, error: PGRST116 });
        useClient(supabaseClient({ tables: { content_reports: chain } }));

        await ReportRepository.checkPendingByUser('u1', 'c1');

        expect(chain.eq).toHaveBeenCalledWith('reporter_id', 'u1');
        expect(chain.eq).toHaveBeenCalledWith('content_id', 'c1');
        // Without this, a previously resolved report would block a new one.
        expect(chain.eq).toHaveBeenCalledWith('status', 'pending');
    });
});

describe('findPendingGroupedByContent() -- moderation queue', () => {
    it('groups reports under their content item', async () => {
        const reports = [report('r1', 'c1', '2026-06-01T10:00:00Z'), report('r2', 'c1', '2026-06-01T09:00:00Z')];
        useClient(supabaseClient({
            tables: {
                content_reports: { data: reports, error: null },
                content: { data: [{ id: 'c1', title: 'Story One' }], error: null }
            }
        }));

        const result = await ReportRepository.findPendingGroupedByContent();

        expect(result).toHaveLength(1);
        expect(result[0].title).toBe('Story One');
        expect(result[0].reports.map((r: any) => r.id)).toEqual(['r1', 'r2']);
    });

    it('de-duplicates content ids before the second query', async () => {
        const contentChain = queryChain({ data: [{ id: 'c1' }], error: null });
        useClient(supabaseClient({
            tables: {
                content_reports: {
                    data: [report('r1', 'c1', '2026-06-01T10:00:00Z'), report('r2', 'c1', '2026-06-01T09:00:00Z')],
                    error: null
                },
                content: contentChain
            }
        }));

        await ReportRepository.findPendingGroupedByContent();

        // Three reports on one article must fetch that article once, not thrice.
        expect(contentChain.in).toHaveBeenCalledWith('id', ['c1']);
    });

    it('orders content by its most recent report first', async () => {
        // Reports arrive newest-first, so reports[0] is the latest for each item.
        const reports = [
            report('r-new', 'c-recent', '2026-06-10T10:00:00Z'),
            report('r-old', 'c-stale', '2026-06-01T10:00:00Z')
        ];
        useClient(supabaseClient({
            tables: {
                content_reports: { data: reports, error: null },
                content: { data: [{ id: 'c-stale' }, { id: 'c-recent' }], error: null }
            }
        }));

        const result = await ReportRepository.findPendingGroupedByContent();

        // Note the content query returned stale first; the JS sort must override it.
        expect(result.map((c: any) => c.id)).toEqual(['c-recent', 'c-stale']);
    });

    it('short-circuits without a second query when nothing is pending', async () => {
        useClient(supabaseClient({
            tables: { content_reports: { data: [], error: null } }
            // `content` intentionally unregistered: querying it would throw.
        }));

        await expect(ReportRepository.findPendingGroupedByContent()).resolves.toEqual([]);
    });

    it('short-circuits on a null report payload', async () => {
        useClient(supabaseClient({ tables: { content_reports: { data: null, error: null } } }));

        await expect(ReportRepository.findPendingGroupedByContent()).resolves.toEqual([]);
    });

    it('drops reports whose content row is missing', async () => {
        // Content deleted after being reported: the group has nowhere to attach,
        // and the queue must not crash on it.
        useClient(supabaseClient({
            tables: {
                content_reports: { data: [report('r1', 'c-deleted', '2026-06-01T10:00:00Z')], error: null },
                content: { data: [], error: null }
            }
        }));

        await expect(ReportRepository.findPendingGroupedByContent()).resolves.toEqual([]);
    });

    it('tolerates a null content payload', async () => {
        useClient(supabaseClient({
            tables: {
                content_reports: { data: [report('r1', 'c1', '2026-06-01T10:00:00Z')], error: null },
                content: { data: null, error: null }
            }
        }));

        await expect(ReportRepository.findPendingGroupedByContent()).resolves.toEqual([]);
    });

    it('requests only pending reports, newest first', async () => {
        const chain = queryChain({ data: [], error: null });
        useClient(supabaseClient({ tables: { content_reports: chain } }));

        await ReportRepository.findPendingGroupedByContent();

        expect(chain.eq).toHaveBeenCalledWith('status', 'pending');
        expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('propagates an error from either query', async () => {
        mockDb({ tables: { content_reports: { data: null, error: { message: 'reports down' } } } });
        await expect(ReportRepository.findPendingGroupedByContent()).rejects.toEqual({ message: 'reports down' });

        useClient(supabaseClient({
            tables: {
                content_reports: { data: [report('r1', 'c1', '2026-06-01T10:00:00Z')], error: null },
                content: { data: null, error: { message: 'content down' } }
            }
        }));
        await expect(ReportRepository.findPendingGroupedByContent()).rejects.toEqual({ message: 'content down' });
    });
});

describe('resolveByContentId()', () => {
    it('stamps the reviewing admin and timestamp on every pending report', async () => {
        const chain = queryChain({ data: [{ id: 'r1' }, { id: 'r2' }], error: null });
        useClient(supabaseClient({ tables: { content_reports: chain } }));

        await expect(ReportRepository.resolveByContentId('c1', 'resolved_takedown', 'admin-1'))
            .resolves.toEqual([{ id: 'r1' }, { id: 'r2' }]);

        const payload = chain.update.mock.calls[0][0];
        expect(payload.status).toBe('resolved_takedown');
        expect(payload.reviewed_by).toBe('admin-1');
        expect(Number.isNaN(Date.parse(payload.reviewed_at))).toBe(false);
    });

    it('only touches pending reports for that content', async () => {
        const chain = queryChain({ data: [], error: null });
        useClient(supabaseClient({ tables: { content_reports: chain } }));

        await ReportRepository.resolveByContentId('c1', 'dismissed', 'admin-1');

        expect(chain.eq).toHaveBeenCalledWith('content_id', 'c1');
        // Re-stamping already-resolved reports would rewrite moderation history.
        expect(chain.eq).toHaveBeenCalledWith('status', 'pending');
    });

    it('returns [] for a null payload and throws on error', async () => {
        mockDb({ tables: { content_reports: { data: null, error: null } } });
        await expect(ReportRepository.resolveByContentId('c1', 'dismissed', 'a1')).resolves.toEqual([]);

        mockDb({ tables: { content_reports: { data: null, error: { message: 'boom' } } } });
        await expect(ReportRepository.resolveByContentId('c1', 'dismissed', 'a1')).rejects.toEqual({ message: 'boom' });
    });
});
