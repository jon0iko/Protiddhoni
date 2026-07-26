/**
 * Design Pattern: Repository
 * Abstract data access layer for admin action logs
 */

import db from '../config/database';

class AdminActionLogRepository {
    /**
     * Create a new admin action log entry
     * @param {Object} logEntry
     * @param {string} [logEntry.admin_id] - UUID of the admin performing the action.
     *   NULL for 'edit' rows, which are written by the author, not an admin.
     * @param {string} logEntry.action_type - 'approve' | 'reject' | 'unpublish' | 'republish' | 'edit'
     * @param {string} logEntry.content_id - UUID of the content affected
     * @param {string} [logEntry.reason] - Optional reason for the action
     * @param {Object} [logEntry.metadata] - Snapshot of content state at time of action
     */
    async create(logEntry) {
        const { data, error } = await db.getClient()
            .from('admin_action_log')
            .insert(logEntry)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Fetch all admin action logs with pagination, newest first.
     * Joins admin user and content details.
     *
     * @param {string} [reviewState] - optional 'unchecked' | 'checked' filter,
     *   used by the moderation queue to show only outstanding work items.
     *
     * Note on the actor column: `admin` is NULL for action_type = 'edit' rows,
     * because the actor there is the AUTHOR, not an admin. `content.author` is
     * joined for exactly that reason — consumers should fall back to it.
     */
    async findAll({ page = 1, limit = 20, reviewState, actionType }: { page?: any; limit?: any; reviewState?: any; actionType?: any } = {}) {
        const pageNum = Math.max(1, parseInt(String(page)) || 1);
        const pageLimit = Math.max(1, Math.min(50, parseInt(String(limit)) || 20));
        const from = (pageNum - 1) * pageLimit;
        const to = from + pageLimit - 1;

        let query = db.getClient()
            .from('admin_action_log')
            .select(`
                *,
                admin:admin_id (id, username, full_name, profile_picture_url),
                content:content_id (id, title, slug, is_published, status, author_id,
                    author:author_id (id, username, full_name, profile_picture_url)
                ),
                reverted_by_admin:reverted_by (id, username, full_name),
                checked_by_admin:checked_by (id, username, full_name)
            `, { count: 'exact' })
            .order('created_at', { ascending: false });

        if (reviewState) {
            query = query.eq('review_state', String(reviewState));
        }

        if (actionType) {
            query = query.eq('action_type', String(actionType));
        }

        const { data, error, count } = await query.range(from, to);

        if (error) throw error;

        return {
            data: data || [],
            pagination: {
                page: pageNum,
                limit: pageLimit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / pageLimit)
            }
        };
    }

    /**
     * Find all action logs for a specific content item
     */
    async findByContentId(contentId) {
        const { data, error } = await db.getClient()
            .from('admin_action_log')
            .select(`
                *,
                admin:admin_id (id, username, full_name)
            `)
            .eq('content_id', contentId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    /**
     * Find the most recent non-reverted unpublish action for a content item
     */
    async findActiveUnpublish(contentId) {
        const { data, error } = await db.getClient()
            .from('admin_action_log')
            .select('*')
            .eq('content_id', contentId)
            .eq('action_type', 'unpublish')
            .eq('is_reverted', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
        return data || null;
    }

    /**
     * Mark an action log entry as reverted
     */
    async markReverted(logId, revertedByAdminId) {
        const { data, error } = await db.getClient()
            .from('admin_action_log')
            .update({
                is_reverted: true,
                reverted_by: revertedByAdminId,
                reverted_at: new Date().toISOString()
            })
            .eq('id', logId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Mark an action log entry as checked by an admin (moderation queue triage).
     * Orthogonal to markReverted — 'checked' means "an admin has looked at this",
     * not "this action was undone".
     */
    async markChecked(logId, adminId) {
        const { data, error } = await db.getClient()
            .from('admin_action_log')
            .update({
                review_state: 'checked',
                checked_by: adminId,
                checked_at: new Date().toISOString()
            })
            .eq('id', logId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

export default new AdminActionLogRepository();
