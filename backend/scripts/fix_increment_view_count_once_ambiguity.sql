-- Fix for increment_view_count_once ambiguity error (42702)
-- Error seen: "column reference \"content_id\" is ambiguous"
-- Safe to run multiple times.

DROP FUNCTION IF EXISTS public.increment_view_count_once(UUID, TEXT, TEXT);

CREATE FUNCTION public.increment_view_count_once(
    p_content_id UUID,
    p_session_key TEXT,
    p_viewer_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count INTEGER;
BEGIN
    INSERT INTO public.content_view_sessions (content_id, session_key, viewer_key)
    VALUES ($1, $2, $3)
    ON CONFLICT (content_id, session_key) DO NOTHING;

    GET DIAGNOSTICS inserted_count = ROW_COUNT;

    IF inserted_count > 0 THEN
        UPDATE public.content AS c
        SET view_count = c.view_count + 1
        WHERE c.id = $1;

        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_view_count_once(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_view_count_once(UUID, TEXT, TEXT) TO anon;
