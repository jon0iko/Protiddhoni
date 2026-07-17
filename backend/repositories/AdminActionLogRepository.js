/**
 * Design Pattern: Repository
 * Abstract data access layer for admin action logs
 */

const db = require('../config/database');

class AdminActionLogRepository {
    /**
     * Create a new admin action log entry
     * @param {Object} logEntry
     * @param {string} logEntry.admin_id - UUID of the admin performing the action
     * @param {string} logEntry.action_type - 'approve' | 'reject' | 'unpublish' | 'republish'
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
     */
    async findAll({ page = 1, limit = 20 } = {}) {
        const pageNum = Math.max(1, parseInt(page) || 1);
        const pageLimit = Math.max(1, Math.min(50, parseInt(limit) || 20));
        const from = (pageNum - 1) * pageLimit;
        const to = from + pageLimit - 1;

        const { data, error, count } = await db.getClient()
            .from('admin_action_log')
            .select(`
                *,
                admin:admin_id (id, username, full_name, profile_picture_url),
                content:content_id (id, title, slug, is_published, status, author_id,
                    author:author_id (id, username, full_name)
                ),
                reverted_by_admin:reverted_by (id, username, full_name)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

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
}

module.exports = new AdminActionLogRepository();
