-- Create content_reports table for user content reports
CREATE TABLE IF NOT EXISTS content_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    reason_category VARCHAR(50) NOT NULL, -- spam, inappropriate, copyright, hate_speech, misinformation, other
    reason_details TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, resolved_takedown, dismissed
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent spamming: unique pending report per user per content
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_report_per_user 
ON content_reports (reporter_id, content_id) WHERE status = 'pending';

-- Index for admin queries on pending reports grouped by content
CREATE INDEX IF NOT EXISTS idx_content_reports_pending 
ON content_reports (content_id) WHERE status = 'pending';
