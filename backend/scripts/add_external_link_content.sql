-- =============================================================================
-- "External link" content type
-- Run this in the Supabase SQL editor (or psql) AFTER pulling the code changes.
-- All statements are idempotent and safe to re-run.
-- =============================================================================
--
-- Authors can register writing they published somewhere else (Facebook, a blog,
-- a magazine site) as a first-class content row so their profile shows their
-- whole body of work. Such a row has content_type = 'link' and carries a URL
-- instead of a body.
--
-- Two schema changes are needed:
--   1. external_url — where the piece actually lives.
--   2. body must become nullable — a link post has no body of its own, and the
--      original schema declared `body TEXT NOT NULL`, which blocks the insert.
--
-- Nothing else changes: content_type is a plain VARCHAR(20) with no CHECK
-- constraint, so 'link' is already an accepted value.
-- =============================================================================

ALTER TABLE content
    ADD COLUMN IF NOT EXISTS external_url TEXT;

COMMENT ON COLUMN content.external_url IS
    'For content_type = ''link'': the absolute http(s) URL of the piece as published on an external platform. NULL for all other content types.';

-- A link post has no body. Dropping NOT NULL is a no-op if already dropped.
ALTER TABLE content
    ALTER COLUMN body DROP NOT NULL;
