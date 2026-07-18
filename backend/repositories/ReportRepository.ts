/**
 * Design Pattern: Repository
 * Abstract data access layer for content reports
 */

import db from '../config/database';

class ReportRepository {
    /**
     * Create a new content report
     */
    async create(reportData: {
        reporter_id: string;
        content_id: string;
        reason_category: string;
        reason_details?: string | null;
    }) {
        const { data, error } = await db.getClient()
            .from('content_reports')
            .insert(reportData)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Check if user already reported this content and it is still pending
     */
    async checkPendingByUser(reporterId: string, contentId: string) {
        const { data, error } = await db.getClient()
            .from('content_reports')
            .select('id')
            .eq('reporter_id', reporterId)
            .eq('content_id', contentId)
            .eq('status', 'pending')
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    }

    /**
     * Find all pending reports, grouped/attached by content item with details
     */
    async findPendingGroupedByContent() {
        // First get all pending reports with reporter information
        const { data: reports, error: reportsError } = await db.getClient()
            .from('content_reports')
            .select(`
                *,
                reporter:reporter_id (id, username, full_name, profile_picture_url)
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (reportsError) throw reportsError;
        if (!reports || reports.length === 0) return [];

        // Get unique content IDs that have pending reports
        const contentIds = [...new Set(reports.map(r => r.content_id))];

        // Fetch those content items along with their authors and category
        const { data: contents, error: contentsError } = await db.getClient()
            .from('content')
            .select(`
                *,
                author:author_id (id, username, full_name, profile_picture_url),
                category:category_id (id, name, slug)
            `)
            .in('id', contentIds);

        if (contentsError) throw contentsError;

        // Group reports under their respective content item
        const groupedMap = new Map();
        for (const content of (contents || [])) {
            groupedMap.set(content.id, {
                ...content,
                reports: []
            });
        }

        for (const report of reports) {
            const contentGroup = groupedMap.get(report.content_id);
            if (contentGroup) {
                contentGroup.reports.push(report);
            }
        }

        // Return array sorted by latest report timestamp
        return Array.from(groupedMap.values()).sort((a, b) => {
            const latestA = a.reports.length > 0 ? new Date(a.reports[0].created_at).getTime() : 0;
            const latestB = b.reports.length > 0 ? new Date(b.reports[0].created_at).getTime() : 0;
            return latestB - latestA;
        });
    }

    /**
     * Resolve all pending reports for a content item
     */
    async resolveByContentId(contentId: string, newStatus: 'resolved_takedown' | 'dismissed', adminId: string) {
        const { data, error } = await db.getClient()
            .from('content_reports')
            .update({
                status: newStatus,
                reviewed_by: adminId,
                reviewed_at: new Date().toISOString()
            })
            .eq('content_id', contentId)
            .eq('status', 'pending')
            .select();

        if (error) throw error;
        return data || [];
    }
}

export default new ReportRepository();
