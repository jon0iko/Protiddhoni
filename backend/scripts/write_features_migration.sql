-- Migration Script for Protiddhoni Write Features
-- Run this in your Supabase SQL Editor
-- Date: 2025-12-19

-- =============================================
-- 1. ADD MISSING INDEXES FOR PERFORMANCE
-- =============================================

-- Index for faster author stats queries
CREATE INDEX IF NOT EXISTS idx_content_author_published 
ON content(author_id, is_published);

-- Index for faster content filtering by status
CREATE INDEX IF NOT EXISTS idx_content_author_status 
ON content(author_id, status);

-- Index for sorting by updated_at
CREATE INDEX IF NOT EXISTS idx_content_updated 
ON content(updated_at DESC);

-- Index for view count sorting
CREATE INDEX IF NOT EXISTS idx_content_views 
ON content(view_count DESC);

-- =============================================
-- 2. CREATE VIEW FOR AUTHOR STATS
-- =============================================

-- Helper function to strip HTML tags (needed before counting words)
CREATE OR REPLACE FUNCTION strip_html_tags(html TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    IF html IS NULL OR html = '' THEN
        RETURN '';
    END IF;
    RETURN TRIM(regexp_replace(regexp_replace(html, E'<[^>]*>', ' ', 'g'), E'\\s+', ' ', 'g'));
END;
$$;

COMMENT ON FUNCTION strip_html_tags(TEXT) IS 'Strips HTML tags from text and normalizes whitespace';

CREATE OR REPLACE VIEW author_stats AS
SELECT 
    c.author_id,
    COUNT(c.id) as total_content,
    COUNT(CASE WHEN c.is_published = true THEN 1 END) as published_count,
    COUNT(CASE WHEN c.status = 'draft' THEN 1 END) as draft_count,
    COUNT(CASE WHEN c.status = 'pending' THEN 1 END) as pending_count,
    COALESCE(SUM(count_words(c.body)), 0) as total_words,
    COALESCE(SUM(c.view_count), 0) as total_views,
    COUNT(DISTINCT r.id) as total_ratings
FROM content c
LEFT JOIN ratings r ON c.id = r.content_id
GROUP BY c.author_id;

-- Add comment to view
COMMENT ON VIEW author_stats IS 'Aggregated statistics for each author including content counts, word count, views, and ratings';

-- =============================================
-- 3. CREATE FUNCTION TO GET AUTHOR STATS
-- =============================================

CREATE OR REPLACE FUNCTION get_author_stats(author_uuid UUID)
RETURNS TABLE (
    total_content BIGINT,
    published_count BIGINT,
    draft_count BIGINT,
    pending_count BIGINT,
    total_words BIGINT,
    total_views BIGINT,
    total_ratings BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(c.id)::BIGINT as total_content,
        COUNT(CASE WHEN c.is_published = true THEN 1 END)::BIGINT as published_count,
        COUNT(CASE WHEN c.status = 'draft' THEN 1 END)::BIGINT as draft_count,
        COUNT(CASE WHEN c.status = 'pending' THEN 1 END)::BIGINT as pending_count,
        COALESCE(SUM(count_words(c.body)), 0)::BIGINT as total_words,
        COALESCE(SUM(c.view_count), 0)::BIGINT as total_views,
        COUNT(DISTINCT r.id)::BIGINT as total_ratings
    FROM content c
    LEFT JOIN ratings r ON c.id = r.content_id
    WHERE c.author_id = author_uuid
    GROUP BY c.author_id;
    
    -- If no content found, return zeros
    IF NOT FOUND THEN
        RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT;
    END IF;
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION get_author_stats(UUID) IS 'Returns comprehensive statistics for a specific author';

-- =============================================
-- 4. ENSURE READING_PREFERENCES TABLE EXISTS
-- =============================================

-- This table should already exist from schema.md, but we'll add if missing
CREATE TABLE IF NOT EXISTS reading_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    theme VARCHAR(20) DEFAULT 'light', -- 'light', 'dark', 'sepia'
    font_size VARCHAR(20) DEFAULT 'medium', -- 'small', 'medium', 'large', 'xlarge'
    font_family VARCHAR(50) DEFAULT 'Kalpurush',
    line_height VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_reading_preferences_user 
ON reading_preferences(user_id);

-- =============================================
-- 5. ADD TRIGGER FOR UPDATED_AT ON READING_PREFERENCES
-- =============================================

CREATE OR REPLACE FUNCTION update_reading_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_reading_preferences_timestamp ON reading_preferences;

CREATE TRIGGER trigger_update_reading_preferences_timestamp
BEFORE UPDATE ON reading_preferences
FOR EACH ROW
EXECUTE FUNCTION update_reading_preferences_timestamp();

-- =============================================
-- 6. ADD WORD COUNT FUNCTION FOR CONTENT
-- =============================================

CREATE OR REPLACE FUNCTION count_words(text_content TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    clean_text TEXT;
BEGIN
    IF text_content IS NULL OR TRIM(text_content) = '' THEN
        RETURN 0;
    END IF;
    
    -- Strip HTML tags first (body stores TipTap HTML)
    clean_text := strip_html_tags(text_content);
    
    IF clean_text = '' THEN
        RETURN 0;
    END IF;
    
    RETURN array_length(regexp_split_to_array(clean_text, E'\\s+'), 1);
END;
$$;

COMMENT ON FUNCTION count_words(TEXT) IS 'Counts words in a text string, stripping HTML tags first';

-- =============================================
-- 7. CREATE FUNCTION TO GET RECENT ACTIVITY
-- =============================================

CREATE OR REPLACE FUNCTION get_recent_activity(author_uuid UUID, activity_limit INT DEFAULT 10)
RETURNS TABLE (
    content_id UUID,
    title VARCHAR(255),
    content_type VARCHAR(20),
    action VARCHAR(20),
    updated_at TIMESTAMP
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as content_id,
        c.title,
        c.content_type,
        CASE 
            WHEN c.is_published = true THEN 'published'::VARCHAR(20)
            WHEN c.status = 'draft' THEN 'edited'::VARCHAR(20)
            ELSE 'created'::VARCHAR(20)
        END as action,
        c.updated_at
    FROM content c
    WHERE c.author_id = author_uuid
    ORDER BY c.updated_at DESC
    LIMIT activity_limit;
END;
$$;

COMMENT ON FUNCTION get_recent_activity(UUID, INT) IS 'Returns recent content activity for an author';

-- =============================================
-- 8. ADD POLICIES FOR ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on reading_preferences if not already enabled
ALTER TABLE reading_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own preferences
DROP POLICY IF EXISTS "Users can view own reading preferences" ON reading_preferences;
CREATE POLICY "Users can view own reading preferences"
ON reading_preferences FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
DROP POLICY IF EXISTS "Users can insert own reading preferences" ON reading_preferences;
CREATE POLICY "Users can insert own reading preferences"
ON reading_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own preferences
DROP POLICY IF EXISTS "Users can update own reading preferences" ON reading_preferences;
CREATE POLICY "Users can update own reading preferences"
ON reading_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own preferences
DROP POLICY IF EXISTS "Users can delete own reading preferences" ON reading_preferences;
CREATE POLICY "Users can delete own reading preferences"
ON reading_preferences FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- 9. CREATE MATERIALIZED VIEW FOR PERFORMANCE
-- =============================================

-- Materialized view for author stats (faster queries)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_author_stats AS
SELECT 
    c.author_id,
    u.username,
    u.full_name,
    COUNT(c.id) as total_content,
    COUNT(CASE WHEN c.is_published = true THEN 1 END) as published_count,
    COUNT(CASE WHEN c.status = 'draft' THEN 1 END) as draft_count,
    COALESCE(SUM(count_words(c.body)), 0) as total_words,
    COALESCE(SUM(c.view_count), 0) as total_views,
    COUNT(DISTINCT r.id) as total_ratings,
    MAX(c.updated_at) as last_activity
FROM content c
JOIN users u ON c.author_id = u.id
LEFT JOIN ratings r ON c.id = r.content_id
GROUP BY c.author_id, u.username, u.full_name;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_author_stats_author 
ON mv_author_stats(author_id);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_author_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_author_stats;
END;
$$;

COMMENT ON FUNCTION refresh_author_stats() IS 'Refreshes the materialized view of author statistics';

-- =============================================
-- 10. GRANT NECESSARY PERMISSIONS
-- =============================================

-- Grant permissions to authenticated users
GRANT SELECT ON author_stats TO authenticated;
GRANT SELECT ON mv_author_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_author_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_activity(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION count_words(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION strip_html_tags(TEXT) TO authenticated;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Test author stats function
-- SELECT * FROM get_author_stats('your-user-uuid-here');

-- Test recent activity function  
-- SELECT * FROM get_recent_activity('your-user-uuid-here', 5);

-- View author stats
-- SELECT * FROM author_stats WHERE author_id = 'your-user-uuid-here';

-- =============================================
-- COMPLETED SUCCESSFULLY
-- =============================================
-- All migrations have been applied.
-- Your write features are now production-ready!
