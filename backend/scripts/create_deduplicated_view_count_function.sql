-- Deduplicated view tracking for read page
-- Ensures one counted view per content per browser session

CREATE TABLE IF NOT EXISTS public.content_view_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    session_key TEXT NOT NULL,
    viewer_key TEXT NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_content_view_sessions_content_session UNIQUE (content_id, session_key)
);

CREATE INDEX IF NOT EXISTS idx_content_view_sessions_content_id
ON public.content_view_sessions(content_id);

CREATE INDEX IF NOT EXISTS idx_content_view_sessions_viewed_at
ON public.content_view_sessions(viewed_at DESC);

-- Returns true when a new view was counted, false when deduped
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
