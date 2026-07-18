-- =============================================================================
-- Top authors RPC for the homepage author reel
-- Run this in the Supabase SQL editor (or psql) AFTER pulling the code changes.
-- All statements are idempotent and safe to re-run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- get_top_authors(p_limit)
--
-- Powers the homepage "top authors" reel. Ranks authors by the TOTAL number of
-- views across their published + approved content, tie-broken by how many such
-- pieces they have.
--
-- Doing the aggregation in Postgres means the homepage costs ONE round-trip that
-- returns at most p_limit rows, instead of pulling every content row into Node
-- and grouping there. The controller additionally caches the result for 5 min.
--
-- The controller has a graceful fallback: if this function does not exist yet it
-- falls back to an in-JS aggregation, so deploying the code before running this
-- migration will not break the homepage. Running this migration makes it fast.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_top_authors(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    username TEXT,
    full_name TEXT,
    profile_picture_url TEXT,
    total_views BIGINT,
    article_count BIGINT
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        u.id,
        u.username::TEXT              AS username,
        u.full_name::TEXT             AS full_name,
        u.profile_picture_url::TEXT   AS profile_picture_url,
        COALESCE(SUM(c.view_count), 0)::BIGINT AS total_views,
        COUNT(*)::BIGINT                       AS article_count
    FROM content c
    JOIN users u ON c.author_id = u.id
    WHERE c.is_published = true
      AND c.status = 'approved'
    GROUP BY u.id, u.username, u.full_name, u.profile_picture_url
    HAVING COUNT(*) >= 1
    ORDER BY COALESCE(SUM(c.view_count), 0) DESC, COUNT(*) DESC
    LIMIT p_limit;
$$;

COMMENT ON FUNCTION get_top_authors(INTEGER) IS
    'Returns the top p_limit authors ranked by total view count across their published, approved content (tie-broken by article count). Used by the homepage author reel.';

-- The homepage is public, so both signed-in and anonymous visitors must be able
-- to call this.
GRANT EXECUTE ON FUNCTION get_top_authors(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_authors(INTEGER) TO anon;

-- Supporting index for the GROUP BY / JOIN on author_id. Harmless if it already
-- exists (there are partial indexes on (author_id, ...) but not a plain one).
CREATE INDEX IF NOT EXISTS idx_content_author ON content(author_id);
