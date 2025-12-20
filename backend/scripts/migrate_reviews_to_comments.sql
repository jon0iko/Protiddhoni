-- Migration: Convert Reviews to Comments System
-- This script converts the reviews table to a comments table with reply support

-- Step 1: Create new comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_comments_content ON comments(content_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);

-- Step 3: Migrate existing reviews to comments (if reviews table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviews') THEN
        INSERT INTO comments (id, content_id, user_id, comment_text, rating, parent_comment_id, is_edited, created_at, updated_at)
        SELECT 
            id,
            content_id,
            user_id,
            COALESCE(review_text, ''), -- review_text was optional, now required
            rating,
            NULL, -- No parent for migrated reviews
            (updated_at != created_at) as is_edited,
            created_at,
            updated_at
        FROM reviews
        WHERE review_text IS NOT NULL AND review_text != '';
        
        -- Optional: Drop old reviews table after successful migration
        -- DROP TABLE IF EXISTS reviews;
    END IF;
END $$;

-- Step 4: Create function to calculate average rating (only for top-level comments with ratings)
CREATE OR REPLACE FUNCTION get_content_rating_stats(p_content_id UUID)
RETURNS TABLE(average DECIMAL, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ROUND(AVG(rating)::NUMERIC, 1), 0) as average,
        COUNT(rating) as count
    FROM comments
    WHERE content_id = p_content_id 
        AND parent_comment_id IS NULL 
        AND rating IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create function to get comment count (including replies)
CREATE OR REPLACE FUNCTION get_content_comment_count(p_content_id UUID)
RETURNS BIGINT AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM comments
        WHERE content_id = p_content_id
    );
END;
$$ LANGUAGE plpgsql;
