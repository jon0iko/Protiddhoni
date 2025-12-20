-- Function to atomically increment view count for content
-- This function is called by the ContentRepository to track content views

CREATE OR REPLACE FUNCTION public.increment_view_count(content_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE content
    SET view_count = view_count + 1
    WHERE id = content_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_view_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_view_count(UUID) TO anon;

-- Note: Run this SQL in your Supabase SQL editor to create the function
