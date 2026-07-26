-- =============================================================================
-- Content edit moderation for Protiddhoni
-- Run these in the Supabase SQL editor (or psql) AFTER pulling the code changes.
-- All statements are idempotent and safe to re-run.
--
-- Two parts:
--   1. Retroactive DDL for public.admin_action_log. That table was created by
--      hand in Supabase and has never existed in version control. This section
--      reproduces it so a fresh environment can be provisioned from scripts.
--   2. The new `review_state` moderation-queue columns used by the author-edit
--      audit trail (action_type = 'edit').
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. admin_action_log (retroactive — table already exists in the live project)
--
-- Every administrative decision on a content item is appended here. `metadata`
-- holds a JSON snapshot of the content state at the time of the action so the
-- history UI can still render a row whose content has since been deleted.
--
-- is_reverted / reverted_by / reverted_at mean specifically "this unpublish was
-- undone by a later republish". They are NOT a generic 'handled' flag — see
-- review_state below for that.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_action_log (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action_type  VARCHAR(20) NOT NULL,
    content_id   UUID REFERENCES public.content(id) ON DELETE CASCADE,
    reason       TEXT,
    metadata     JSONB DEFAULT '{}'::JSONB,
    is_reverted  BOOLEAN NOT NULL DEFAULT FALSE,
    reverted_by  UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reverted_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The history feed is always ordered newest-first and paginated.
CREATE INDEX IF NOT EXISTS idx_admin_action_log_created_at
    ON public.admin_action_log(created_at DESC);

-- findByContentId / findActiveUnpublish look up by content.
CREATE INDEX IF NOT EXISTS idx_admin_action_log_content
    ON public.admin_action_log(content_id, created_at DESC);

-- findActiveUnpublish filters on (content_id, action_type, is_reverted).
CREATE INDEX IF NOT EXISTS idx_admin_action_log_active_unpublish
    ON public.admin_action_log(content_id, action_type, is_reverted);

CREATE INDEX IF NOT EXISTS idx_admin_action_log_admin
    ON public.admin_action_log(admin_id);


-- -----------------------------------------------------------------------------
-- 2a. admin_id must be nullable
--
-- An author editing their own published article is logged with
-- action_type = 'edit' and admin_id = NULL — there is no admin actor at the
-- time the row is written. The actor for such a row is the content's author.
-- -----------------------------------------------------------------------------
ALTER TABLE public.admin_action_log ALTER COLUMN admin_id DROP NOT NULL;


-- -----------------------------------------------------------------------------
-- 2b. Widen the action_type CHECK constraint (if one exists) to allow 'edit'
--
-- The live table may or may not carry a CHECK constraint — the application only
-- documents the allowed values in JSDoc. Drop any known-named variant and
-- recreate it inclusively. If no constraint exists the DROPs are no-ops.
-- -----------------------------------------------------------------------------
ALTER TABLE public.admin_action_log
    DROP CONSTRAINT IF EXISTS admin_action_log_action_type_check;

DO $$
BEGIN
    ALTER TABLE public.admin_action_log
        ADD CONSTRAINT admin_action_log_action_type_check
        CHECK (action_type IN ('approve', 'reject', 'unpublish', 'republish', 'edit'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


-- -----------------------------------------------------------------------------
-- 2c. review_state — the moderation queue flag
--
-- Orthogonal to is_reverted. 'unchecked' means an admin has not yet looked at
-- this log row; 'checked' means it has been triaged. Author edits land here as
-- 'unchecked' and are cleared from /admin/review/queue by an admin.
-- -----------------------------------------------------------------------------
ALTER TABLE public.admin_action_log
    ADD COLUMN IF NOT EXISTS review_state VARCHAR(20) NOT NULL DEFAULT 'unchecked';

ALTER TABLE public.admin_action_log
    ADD COLUMN IF NOT EXISTS checked_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.admin_action_log
    ADD COLUMN IF NOT EXISTS checked_at TIMESTAMPTZ;

DO $$
BEGIN
    ALTER TABLE public.admin_action_log
        ADD CONSTRAINT admin_action_log_review_state_check
        CHECK (review_state IN ('unchecked', 'checked'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- The edit queue is "review_state = 'unchecked' ORDER BY created_at DESC".
CREATE INDEX IF NOT EXISTS idx_admin_action_log_review_state
    ON public.admin_action_log(review_state, created_at DESC);


-- -----------------------------------------------------------------------------
-- Notes
-- -----------------------------------------------------------------------------
-- * Pre-existing rows get review_state = 'unchecked' from the column DEFAULT.
--   Those are historical admin actions the admin already performed, so if you
--   would rather not see them in the queue, backfill them once:
--
--     UPDATE public.admin_action_log
--        SET review_state = 'checked', checked_at = NOW()
--      WHERE action_type <> 'edit';
--
-- * Nothing in the application reads review_state for non-'edit' rows today,
--   but the column is deliberately generic so other work-item kinds can use it.
