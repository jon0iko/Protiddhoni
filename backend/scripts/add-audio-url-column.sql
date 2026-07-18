-- Audiobook feature: add narration audio support to content.
-- Run ONCE against your Supabase/Postgres database:
--   Supabase Dashboard → SQL Editor → paste → Run
--
-- Because ContentRepository.findBySlug/findById use SELECT *, this column
-- flows through to the API and the reader automatically — no backend code change.

ALTER TABLE content ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- After uploading each MP3 to Supabase Storage (bucket: images, folder: audio),
-- point the story at its public URL. Replace the slug and URL for each story:
--
--   UPDATE content
--   SET audio_url = 'https://<YOUR-PROJECT>.supabase.co/storage/v1/object/public/images/audio/my-story.mp3'
--   WHERE slug = 'my-story';
--
-- If instead you commit the file to frontend/protiddhoni/public/audio/, use a
-- root-relative path:
--
--   UPDATE content
--   SET audio_url = '/audio/my-story.mp3'
--   WHERE slug = 'my-story';
