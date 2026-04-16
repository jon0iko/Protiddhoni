-- Create content_purchases table for tracking purchased premium content
-- This prevents users from being asked to pay twice for the same content

CREATE TABLE IF NOT EXISTS content_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL, -- Price paid at time of purchase
    purchased_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure one purchase record per user-content pair
    UNIQUE(user_id, content_id),
    
    -- Indexes for fast lookups
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_content_purchases_user ON content_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_content_purchases_content ON content_purchases(content_id);
CREATE INDEX IF NOT EXISTS idx_content_purchases_user_content ON content_purchases(user_id, content_id);

-- Add comment to table
COMMENT ON TABLE content_purchases IS 'Tracks which users have purchased premium content to prevent double-charging';

-- Function to check if user has purchased content
CREATE OR REPLACE FUNCTION has_purchased_content(user_uuid UUID, content_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM content_purchases 
        WHERE user_id = user_uuid 
        AND content_id = content_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- Function to record a content purchase
CREATE OR REPLACE FUNCTION record_content_purchase(
    user_uuid UUID, 
    content_uuid UUID, 
    price_amount DECIMAL
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO content_purchases (user_id, content_id, amount)
    VALUES (user_uuid, content_uuid, price_amount)
    ON CONFLICT (user_id, content_id) DO NOTHING;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Add comment to functions
COMMENT ON FUNCTION has_purchased_content(UUID, UUID) IS 'Check if a user has purchased specific content';
COMMENT ON FUNCTION record_content_purchase(UUID, UUID, DECIMAL) IS 'Record a content purchase transaction';
