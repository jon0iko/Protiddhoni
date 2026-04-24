-- Migration: Fix word count calculation in author stats
-- The previous implementation used LENGTH(c.body) which counts CHARACTERS, not words.
-- Since body contains HTML (from TipTap editor), it was counting HTML tags too.
-- This migration fixes it to properly strip HTML and count actual words.
-- 
-- Run this in your Supabase SQL Editor.
-- Date: 2026-04-24

-- =============================================
-- 1. UPDATE count_words FUNCTION
--    Now strips HTML tags inline (no external dependency)
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
    
    -- Strip HTML tags, then collapse whitespace
    clean_text := TRIM(regexp_replace(regexp_replace(text_content, E'<[^>]*>', ' ', 'g'), E'\\s+', ' ', 'g'));
    
    IF clean_text = '' THEN
        RETURN 0;
    END IF;
    
    RETURN array_length(regexp_split_to_array(clean_text, E'\\s+'), 1);
END;
$$;

COMMENT ON FUNCTION count_words(TEXT) IS 'Counts words in a text string, stripping HTML tags first';

-- =============================================
-- 2. UPDATE get_author_stats FUNCTION
--    Use count_words() instead of LENGTH()
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

COMMENT ON FUNCTION get_author_stats(UUID) IS 'Returns comprehensive statistics for a specific author with accurate word counts';

-- =============================================
-- 3. UPDATE author_stats VIEW
-- =============================================

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

COMMENT ON VIEW author_stats IS 'Aggregated statistics for each author with accurate word counts';

-- =============================================
-- 4. RECREATE MATERIALIZED VIEW
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
    COALESCE(SUM(count_words(c.body)), 0) as total_words,
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
-- 5. GRANT PERMISSIONS
-- =============================================

GRANT EXECUTE ON FUNCTION count_words(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_author_stats(UUID) TO authenticated;
GRANT SELECT ON author_stats TO authenticated;
GRANT SELECT ON mv_author_stats TO authenticated;

-- =============================================
-- VERIFICATION (uncomment to test)
-- =============================================

-- SELECT title, LENGTH(body) as char_count, count_words(body) as word_count FROM content LIMIT 5;
-- SELECT * FROM get_author_stats('your-user-uuid-here');
