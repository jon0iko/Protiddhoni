-- ROLLBACK: Revert word count fix back to original LENGTH-based calculation
-- Run this in Supabase SQL Editor ONLY if the fix_word_count_migration.sql caused issues.
-- Date: 2026-04-24

-- =============================================
-- 1. REVERT get_author_stats FUNCTION
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
        COALESCE(SUM(LENGTH(c.body)), 0)::BIGINT as total_words,
        COALESCE(SUM(c.view_count), 0)::BIGINT as total_views,
        COUNT(DISTINCT r.id)::BIGINT as total_ratings
    FROM content c
    LEFT JOIN ratings r ON c.id = r.content_id
    WHERE c.author_id = author_uuid
    GROUP BY c.author_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT;
    END IF;
END;
$$;

-- =============================================
-- 2. REVERT author_stats VIEW
-- =============================================

CREATE OR REPLACE VIEW author_stats AS
SELECT 
    c.author_id,
    COUNT(c.id) as total_content,
    COUNT(CASE WHEN c.is_published = true THEN 1 END) as published_count,
    COUNT(CASE WHEN c.status = 'draft' THEN 1 END) as draft_count,
    COUNT(CASE WHEN c.status = 'pending' THEN 1 END) as pending_count,
    COALESCE(SUM(LENGTH(c.body)), 0) as total_words,
    COALESCE(SUM(c.view_count), 0) as total_views,
    COUNT(DISTINCT r.id) as total_ratings
FROM content c
LEFT JOIN ratings r ON c.id = r.content_id
GROUP BY c.author_id;

-- =============================================
-- 3. REVERT MATERIALIZED VIEW
-- =============================================

DROP MATERIALIZED VIEW IF EXISTS mv_author_stats;

CREATE MATERIALIZED VIEW mv_author_stats AS
SELECT 
    c.author_id,
    u.username,
    u.full_name,
    COUNT(c.id) as total_content,
    COUNT(CASE WHEN c.is_published = true THEN 1 END) as published_count,
    COUNT(CASE WHEN c.status = 'draft' THEN 1 END) as draft_count,
    COALESCE(SUM(LENGTH(c.body)), 0) as total_words,
    COALESCE(SUM(c.view_count), 0) as total_views,
    COUNT(DISTINCT r.id) as total_ratings,
    MAX(c.updated_at) as last_activity
FROM content c
JOIN users u ON c.author_id = u.id
LEFT JOIN ratings r ON c.id = r.content_id
GROUP BY c.author_id, u.username, u.full_name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_author_stats_author 
ON mv_author_stats(author_id);

-- =============================================
-- 4. REVERT count_words FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION count_words(text_content TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN array_length(regexp_split_to_array(TRIM(text_content), E'\\s+'), 1);
END;
$$;

-- =============================================
-- 5. OPTIONALLY DROP strip_html_tags (safe to keep)
-- =============================================

-- Uncomment the line below if you want to remove it entirely:
-- DROP FUNCTION IF EXISTS strip_html_tags(TEXT);

-- =============================================
-- DONE - reverted to original LENGTH-based word count
-- =============================================
