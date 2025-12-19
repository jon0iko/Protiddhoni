-- Create notifications table for user notifications

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'new_content', 'content_approved', 'content_rejected', 'new_review', 'new_follower', etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_entity_type VARCHAR(50), -- 'content', 'review', 'user', etc.
    related_entity_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY notifications_select_own ON notifications
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can only update their own notifications (mark as read)
CREATE POLICY notifications_update_own ON notifications
    FOR UPDATE
    USING (user_id = auth.uid());

-- Only system/backend can insert notifications (no policy for INSERT from frontend)

COMMENT ON TABLE notifications IS 'Stores user notifications for various events';
COMMENT ON COLUMN notifications.type IS 'Type of notification: new_content, content_approved, content_rejected, new_review, new_follower';
COMMENT ON COLUMN notifications.related_entity_type IS 'Type of entity this notification is about: content, review, user';
COMMENT ON COLUMN notifications.related_entity_id IS 'ID of the related entity';
