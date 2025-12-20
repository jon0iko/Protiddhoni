-- Migration: Separate Ratings from Comments
-- This script creates a new ratings table and moves rating data from comments

-- Step 1: Create ratings table for anonymous/user ratings
CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NULL, -- NULL for anonymous ratings
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    user_identifier VARCHAR(255) NULL, -- For anonymous users (IP hash or session ID)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: One rating per user per content (or one per identifier for anonymous)
    UNIQUE(content_id, user_id),
    UNIQUE(content_id, user_identifier)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ratings_content ON ratings(content_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_identifier ON ratings(user_identifier);
CREATE INDEX IF NOT EXISTS idx_ratings_created ON ratings(created_at DESC);

-- Step 2: Migrate existing ratings from comments to ratings table
INSERT INTO ratings (content_id, user_id, rating, created_at, updated_at)
SELECT 
    content_id,
    user_id,
    rating,
    created_at,
    updated_at
FROM comments
WHERE rating IS NOT NULL 
  AND parent_comment_id IS NULL -- Only top-level comment ratings
ON CONFLICT (content_id, user_id) DO NOTHING; -- Skip duplicates

-- Step 3: Remove rating column from comments table
ALTER TABLE comments DROP COLUMN IF EXISTS rating;

-- Step 4: Remove the rating constraint from comments
ALTER TABLE comments DROP CONSTRAINT IF EXISTS rating_only_on_top_level;

-- Step 5: Drop old rating stats function and create new one
DROP FUNCTION IF EXISTS get_content_rating_stats(UUID);

CREATE FUNCTION get_content_rating_stats(p_content_id UUID)
RETURNS TABLE(average_rating NUMERIC, rating_count BIGINT)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ROUND(AVG(rating)::NUMERIC, 1), 0) as average_rating,
        COUNT(*) as rating_count
    FROM ratings
    WHERE content_id = p_content_id;
END;
$$;

-- Step 6: Drop old upsert function and create new rating upsert function
DROP FUNCTION IF EXISTS upsert_rating(UUID, UUID, VARCHAR, INTEGER);

CREATE FUNCTION upsert_rating(
    p_content_id UUID,
    p_user_id UUID,
    p_user_identifier VARCHAR(255),
    p_rating INTEGER
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    rating_id UUID,
    average_rating NUMERIC,
    rating_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_rating_id UUID;
    v_avg NUMERIC;
    v_count BIGINT;
BEGIN
    -- Validate rating
    IF p_rating < 1 OR p_rating > 5 THEN
        RETURN QUERY SELECT FALSE, 'Rating must be between 1 and 5', NULL::UUID, NULL::NUMERIC, NULL::BIGINT;
        RETURN;
    END IF;
    
    -- Insert or update rating
    IF p_user_id IS NOT NULL THEN
        -- Logged in user
        INSERT INTO ratings (content_id, user_id, rating)
        VALUES (p_content_id, p_user_id, p_rating)
        ON CONFLICT (content_id, user_id) 
        DO UPDATE SET 
            rating = p_rating,
            updated_at = NOW()
        RETURNING id INTO v_rating_id;
    ELSE
        -- Anonymous user
        IF p_user_identifier IS NULL THEN
            RETURN QUERY SELECT FALSE, 'User identifier required for anonymous rating', NULL::UUID, NULL::NUMERIC, NULL::BIGINT;
            RETURN;
        END IF;
        
        INSERT INTO ratings (content_id, user_identifier, rating)
        VALUES (p_content_id, p_user_identifier, p_rating)
        ON CONFLICT (content_id, user_identifier) 
        DO UPDATE SET 
            rating = p_rating,
            updated_at = NOW()
        RETURNING id INTO v_rating_id;
    END IF;
    
    -- Get updated statistics
    SELECT average_rating, rating_count 
    INTO v_avg, v_count
    FROM get_content_rating_stats(p_content_id);
    
    RETURN QUERY SELECT TRUE, 'Rating saved successfully', v_rating_id, v_avg, v_count;
END;
$$;

-- Step 7: Drop old get_user_rating function and create new one
DROP FUNCTION IF EXISTS get_user_rating(UUID, UUID, VARCHAR);

CREATE FUNCTION get_user_rating(
    p_content_id UUID,
    p_user_id UUID,
    p_user_identifier VARCHAR(255)
)
RETURNS TABLE(rating INTEGER)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_user_id IS NOT NULL THEN
        RETURN QUERY
        SELECT r.rating
        FROM ratings r
        WHERE r.content_id = p_content_id 
          AND r.user_id = p_user_id;
    ELSIF p_user_identifier IS NOT NULL THEN
        RETURN QUERY
        SELECT r.rating
        FROM ratings r
        WHERE r.content_id = p_content_id 
          AND r.user_identifier = p_user_identifier;
    END IF;
END;
$$;

-- Step 8: Drop old comment count function and update it
DROP FUNCTION IF EXISTS get_content_comment_count(UUID);

CREATE FUNCTION get_content_comment_count(p_content_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM comments
        WHERE content_id = p_content_id
    );
END;
$$;

-- Verification queries
-- Check ratings table
SELECT 'Ratings table created:' as status, COUNT(*) as count FROM ratings;

-- Check comment count
SELECT 'Comments without ratings:' as status, COUNT(*) as count FROM comments;

-- Test rating stats function
SELECT 'Testing rating stats function:' as status;
SELECT * FROM get_content_rating_stats((SELECT id FROM content LIMIT 1));

-- Success message
SELECT '✅ Migration completed successfully!' as message;
SELECT '📊 Ratings are now separate from comments' as message;
SELECT '👤 Anonymous ratings are now supported' as message;
