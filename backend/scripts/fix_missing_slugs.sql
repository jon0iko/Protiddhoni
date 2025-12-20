-- Script to fix missing slugs in existing content
-- This will generate slugs for any content that has an empty slug

-- For the specific content mentioned (টেস্ট -> test)
UPDATE content 
SET slug = 'test'
WHERE id = 'da878472-5a56-4c3e-926f-120d97c8b15d' 
AND (slug IS NULL OR slug = '');

-- Note: Since we have Bangla transliteration in the backend slugify function,
-- any future content submissions will automatically get proper slugs.
-- For existing content with Bangla titles, you'll need to update them individually
-- or re-save them through the API which will regenerate the slug.

-- To find all content with missing slugs:
-- SELECT id, title, slug FROM content WHERE slug IS NULL OR slug = '';
