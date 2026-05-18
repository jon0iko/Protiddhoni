-- ============================================================================
-- Migration: link quizzes to existing content rows
-- Allows admins to spin up a quiz from any story / chapter / poem.
-- Safe to re-run.
-- ============================================================================

ALTER TABLE public.quizzes
    ADD COLUMN IF NOT EXISTS source_content_id UUID REFERENCES public.content(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_quizzes_source_content_id ON public.quizzes(source_content_id);
