-- ============================================================================
-- Migration: anti-cheat option shuffling + per-quiz time limit
--
-- `shuffle_seed` on quiz_attempts → deterministic per-attempt PRNG seed so
-- option positions can be shuffled at start_attempt and unshuffled at
-- submit_attempt. Two players see different option order; the original
-- correct_index never leaves the server.
--
-- `time_limit_seconds` on quizzes → optional submit deadline (NULL = no limit).
--
-- Idempotent.
-- ============================================================================

ALTER TABLE public.quiz_attempts
    ADD COLUMN IF NOT EXISTS shuffle_seed BIGINT;

ALTER TABLE public.quizzes
    ADD COLUMN IF NOT EXISTS time_limit_seconds INTEGER;
