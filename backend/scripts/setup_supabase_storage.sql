-- =============================================================================
-- Supabase Storage Policies Setup for 'images' Bucket - UNRESTRICTED ACCESS
-- =============================================================================
-- 
-- ⚠️ IMPORTANT: Run this script with the 'postgres' role in Supabase SQL Editor
--
-- In Supabase Dashboard:
-- 1. Go to SQL Editor
-- 2. Look for the role selector dropdown at the top
-- 3. Change from 'authenticated' to 'postgres'
-- 4. Then paste and run this script
-- 
-- This script sets up unrestricted storage policies for the 'images' bucket
-- allowing anyone (authenticated or not) to upload, view, update, and delete images.
-- 
-- =============================================================================

-- Create policies (if not already created)
-- Note: Use IF NOT EXISTS to avoid errors if policies already exist

CREATE POLICY IF NOT EXISTS "Public can upload images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
    bucket_id = 'images'
);

CREATE POLICY IF NOT EXISTS "Public can read images"
ON storage.objects
FOR SELECT
TO public
USING (
    bucket_id = 'images'
);

CREATE POLICY IF NOT EXISTS "Public can update images"
ON storage.objects
FOR UPDATE
TO public
USING (
    bucket_id = 'images'
)
WITH CHECK (
    bucket_id = 'images'
);

CREATE POLICY IF NOT EXISTS "Public can delete images"
ON storage.objects
FOR DELETE
TO public
USING (
    bucket_id = 'images'
);

-- =============================================================================
-- Optional: Create indexes for better performance
-- =============================================================================
-- Create an index on the bucket_id and owner columns for faster queries

CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_owner 
ON storage.objects (bucket_id, owner);

-- =============================================================================
-- Verification Queries
-- =============================================================================

-- Run these queries to verify the policies were created:
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- =============================================================================
-- IMPORTANT NOTES:
-- =============================================================================
-- 
-- 1. Make sure the 'images' bucket exists and is set to PUBLIC in Supabase:
--    Supabase Dashboard > Storage > images bucket > Public: YES
-- 
-- 2. If policies fail to create, ensure you're running as 'postgres' role
-- 
-- 3. ⚠️ SECURITY WARNING: These policies allow ANYONE to upload, modify, and
--    delete images without authentication.
-- 
-- =============================================================================

-- =============================================================================
-- Cleanup (if needed, remove these comments and run as postgres)
-- =============================================================================

-- DROP POLICY IF EXISTS "Public can upload images" ON storage.objects;
-- DROP POLICY IF EXISTS "Public can read images" ON storage.objects;
-- DROP POLICY IF EXISTS "Public can update images" ON storage.objects;
-- DROP POLICY IF EXISTS "Public can delete images" ON storage.objects;


