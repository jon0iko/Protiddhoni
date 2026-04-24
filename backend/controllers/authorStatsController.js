// Author Statistics Controller
// Backend endpoint for fetching author writing statistics

const db = require('../config/database');

/**
 * Get comprehensive stats for an author
 * GET /api/content/stats/author/:authorId
 */
const getAuthorStats = async (req, res) => {
  const { authorId } = req.params;

  try {
    const supabase = db.getClient();

    // Use the database function for consistent results
    const { data, error } = await supabase.rpc('get_author_stats', {
      author_uuid: authorId
    });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        error: 'Database query failed',
        details: error.message
      });
    }

    // Drafts saved from the editor live in a separate `drafts` table and
    // are not counted by get_author_stats — count them here and fold in.
    const { count: draftTableCount, error: draftError } = await supabase
      .from('drafts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', authorId);

    if (draftError) {
      console.error('Error counting drafts table:', draftError);
    }
    const extraDrafts = draftTableCount || 0;

    if (!data || data.length === 0) {
      return res.json({
        totalContent: extraDrafts,
        published: 0,
        drafts: extraDrafts,
        pending: 0,
        totalWords: 0,
        totalViews: 0,
        totalRatings: 0
      });
    }

    const stats = data[0] || data;

    res.json({
      totalContent: (parseInt(stats.total_content) || 0) + extraDrafts,
      published: parseInt(stats.published_count) || 0,
      drafts: (parseInt(stats.draft_count) || 0) + extraDrafts,
      pending: parseInt(stats.pending_count) || 0,
      totalWords: parseInt(stats.total_words) || 0,
      totalViews: parseInt(stats.total_views) || 0,
      totalRatings: parseInt(stats.total_ratings) || 0
    });
  } catch (error) {
    console.error('Error fetching author stats:', error);
    res.status(500).json({
      error: 'Failed to fetch author statistics',
      details: error.message
    });
  }
};

/**
 * Get recent activity for an author
 * GET /api/content/recent-activity/:authorId
 */
const getRecentActivity = async (req, res) => {
  const { authorId } = req.params;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const supabase = db.getClient();
    
    const { data, error } = await supabase.rpc('get_recent_activity', {
      author_uuid: authorId,
      activity_limit: limit
    });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        error: 'Database query failed',
        details: error.message 
      });
    }

    const activities = (data || []).map(row => ({
      id: row.content_id,
      title: row.title,
      type: row.content_type,
      action: row.action,
      timestamp: row.updated_at
    }));

    res.json(activities);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recent activity',
      details: error.message 
    });
  }
};

/**
 * Refresh materialized view of author stats
 * POST /api/content/stats/refresh
 * Admin only
 */
const refreshAuthorStats = async (req, res) => {
  try {
    const supabase = db.getClient();
    
    const { error } = await supabase.rpc('refresh_author_stats');

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        error: 'Database query failed',
        details: error.message 
      });
    }

    res.json({ message: 'Author stats refreshed successfully' });
  } catch (error) {
    console.error('Error refreshing author stats:', error);
    res.status(500).json({ 
      error: 'Failed to refresh author statistics',
      details: error.message 
    });
  }
};

module.exports = {
  getAuthorStats,
  getRecentActivity,
  refreshAuthorStats
};
