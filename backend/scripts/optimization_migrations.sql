-- =============================================================================
-- Optimization migrations for Protiddhoni
-- Run these in the Supabase SQL editor (or psql) AFTER pulling the code changes.
-- All statements are idempotent and safe to re-run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Efficient review-stats aggregation (Audit item #3)
--
-- Before: ContentRepository.getStats() pulled EVERY row from `reviews` for a
-- content on every article view and averaged them in JS. For a popular article
-- that transfers thousands of rows per view.
--
-- After: this function computes COUNT + AVG inside Postgres and returns a single
-- row. The code calls it via .rpc('get_content_review_stats', ...).
--
-- average_rating is rounded to 1 decimal place to match the previous JS output
-- (Math.round(avg * 10) / 10).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_content_review_stats(p_content_id UUID)
RETURNS TABLE (total_reviews BIGINT, average_rating NUMERIC)
LANGUAGE sql
STABLE
AS $$
    SELECT
        COUNT(*)::BIGINT AS total_reviews,
        COALESCE(ROUND(AVG(rating)::NUMERIC, 1), 0) AS average_rating
    FROM reviews
    WHERE content_id = p_content_id;
$$;

-- Supporting index so the aggregation above is an index-only lookup instead of a
-- sequential scan. Harmless if it already exists.
CREATE INDEX IF NOT EXISTS idx_reviews_content ON reviews(content_id);


-- -----------------------------------------------------------------------------
-- 2. (Optional but recommended) Index for the paywall purchase lookup
--
-- The PaywallDecorator checks content_purchases by (user_id, content_id) on
-- every premium content view. A composite index keeps that O(log n).
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_content_purchases_user_content
    ON content_purchases(user_id, content_id);


-- -----------------------------------------------------------------------------
-- Notes
-- -----------------------------------------------------------------------------
-- * The application code has a graceful fallback: if get_content_review_stats
--   does not exist yet, ContentRepository.getStats() falls back to the old
--   in-JS aggregation, so deploying the code before running this migration will
--   not break anything. Running this migration simply makes it fast.
