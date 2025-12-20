-- QUICK START: Run this first in Supabase SQL Editor
-- This ensures uuid extension is available

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Then run the full migration:
-- backend/scripts/write_features_migration.sql

-- After migration, test with your user ID:
-- Replace 'YOUR-USER-UUID' with your actual user UUID

-- Test 1: Get your author stats
SELECT * FROM get_author_stats('YOUR-USER-UUID');

-- Test 2: Get your recent activity
SELECT * FROM get_recent_activity('YOUR-USER-UUID', 5);

-- Test 3: View the author stats view
SELECT * FROM author_stats WHERE author_id = 'YOUR-USER-UUID';

-- Test 4: Check if reading_preferences table exists
SELECT * FROM reading_preferences WHERE user_id = 'YOUR-USER-UUID';

-- If you need to create initial reading preferences:
INSERT INTO reading_preferences (user_id, theme, font_size, font_family, line_height)
VALUES ('YOUR-USER-UUID', 'light', 'medium', 'Kalpurush', 'normal')
ON CONFLICT (user_id) DO NOTHING;
