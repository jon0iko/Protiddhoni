-- ============================================================================
-- Migration: admin generation instructions + a guaranteed base prize pool
--
-- 1. `generation_instructions` on quizzes — free-text steering passed to the AI
--    alongside the topic ("focus on post-1971 poetry, exclude Nazrul's songs").
--    Stored so /regenerate reproduces the same editorial intent.
--
-- 2. `base_pool` on quizzes — Kori the HOUSE seeds the round with, before any
--    entry fee lands. Without it a 3-player round pays 3rd place 20% of 3 entry
--    fees, i.e. less than they paid to enter, and winning is a net loss.
--
--    prize_pool is seeded to base_pool while the round is still editable, and
--    enter_quiz_round adds each entry fee on top. So at settlement:
--        prize_pool = base_pool + (entries collected)
--
--    RAKE CHANGE: rake is now taken on the ENTRY portion only, never on the
--    house's own seed money. Raking the base would mean the house clawing back
--    part of the subsidy it just promised, which defeats the point of the base.
--
-- Idempotent — safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. New columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS generation_instructions TEXT;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS base_pool DECIMAL(12, 2) NOT NULL DEFAULT 0;

-- Round-level generation language. Previously this lived only as a transient
-- control on the "generate more" toolbar, so it reset to 'bn' on every use and
-- a round authored in English or mixed quietly regenerated in Bengali.
-- NOTE: quiz_questions.language records what each question ACTUALLY is; this
-- column records what the round ASKS the model for. 'mixed' is only meaningful
-- here, which is why the two are not merged.
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS language VARCHAR(10) NOT NULL DEFAULT 'bn';

DO $$ BEGIN
    ALTER TABLE public.quizzes
        ADD CONSTRAINT quizzes_language_check CHECK (language IN ('bn', 'en', 'mixed'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.quizzes
        ADD CONSTRAINT quizzes_base_pool_check CHECK (base_pool >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON COLUMN public.quizzes.generation_instructions
    IS 'Admin free-text steering for AI generation: topics to include/exclude, framing, sources';
COMMENT ON COLUMN public.quizzes.base_pool
    IS 'House-seeded Kori included in prize_pool before any entry fee; never raked';
COMMENT ON COLUMN public.quizzes.language
    IS 'Language the AI is instructed to write in: bn | en | mixed';

-- ---------------------------------------------------------------------------
-- 2. Backfill: rounds created before this migration have no base. Existing
--    prize_pool values are entirely entry money, so base_pool = 0 is correct
--    and no prize_pool rewrite is needed.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 3. settle_quiz_round — rake the entry portion only.
--
-- Everything else (row lock, settled_at double-payout guard, 50/30/20 split,
-- last-winner-takes-the-remainder) is unchanged from
-- add_quiz_rounds_and_pool.sql. Only the rake basis moved.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION settle_quiz_round(p_quiz_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_quiz RECORD;
    v_pool DECIMAL(12, 2);
    v_base DECIMAL(12, 2);
    v_entries DECIMAL(12, 2);
    v_rake DECIMAL(12, 2);
    v_distributable DECIMAL(12, 2);
    v_weights DECIMAL[] := ARRAY[0.50, 0.30, 0.20];
    v_winner_count INTEGER;
    v_weight_total DECIMAL := 0;
    v_paid DECIMAL(12, 2) := 0;
    v_amount DECIMAL(12, 2);
    v_row RECORD;
    v_winners JSONB := '[]'::jsonb;
    v_settlement JSONB;
    i INTEGER;
BEGIN
    SELECT id, prize_pool, base_pool, rake_bps, closes_at, settled_at, settlement, title
      INTO v_quiz
      FROM public.quizzes
     WHERE id = p_quiz_id
     FOR UPDATE;

    IF v_quiz.id IS NULL THEN
        RAISE EXCEPTION 'Quiz not found';
    END IF;

    IF v_quiz.settled_at IS NOT NULL THEN
        RETURN jsonb_build_object(
            'already_settled', TRUE,
            'settlement', COALESCE(v_quiz.settlement, '{}'::jsonb)
        );
    END IF;

    IF v_quiz.closes_at IS NULL THEN
        RAISE EXCEPTION 'Round has no closing time and cannot be settled';
    END IF;

    IF CURRENT_TIMESTAMP < v_quiz.closes_at THEN
        RAISE EXCEPTION 'Round is still open';
    END IF;

    v_pool := COALESCE(v_quiz.prize_pool, 0);
    v_base := LEAST(COALESCE(v_quiz.base_pool, 0), v_pool);

    -- Entry money is whatever sits above the house seed. Clamped at 0 so a
    -- hand-edited prize_pool below the base can never produce a negative rake.
    v_entries := GREATEST(v_pool - v_base, 0);
    v_rake := ROUND(v_entries * COALESCE(v_quiz.rake_bps, 0) / 10000.0, 2);
    IF v_rake > v_entries THEN
        v_rake := v_entries;
    END IF;

    v_distributable := v_pool - v_rake;

    SELECT COUNT(*) INTO v_winner_count FROM (
        SELECT id
          FROM public.quiz_attempts
         WHERE quiz_id = p_quiz_id AND status = 'completed'
         ORDER BY score DESC, duration_ms ASC NULLS LAST, completed_at ASC
         LIMIT 3
    ) top;

    IF v_winner_count > 0 THEN
        FOR i IN 1..v_winner_count LOOP
            v_weight_total := v_weight_total + v_weights[i];
        END LOOP;
    END IF;

    IF v_winner_count > 0 AND v_distributable > 0 THEN
        i := 0;
        FOR v_row IN
            SELECT id AS attempt_id, user_id, score, duration_ms, completed_at
              FROM public.quiz_attempts
             WHERE quiz_id = p_quiz_id AND status = 'completed'
             ORDER BY score DESC, duration_ms ASC NULLS LAST, completed_at ASC
             LIMIT 3
        LOOP
            i := i + 1;

            IF i = v_winner_count THEN
                v_amount := v_distributable - v_paid;
            ELSE
                v_amount := ROUND(v_distributable * v_weights[i] / v_weight_total, 2);
            END IF;

            IF v_amount < 0 THEN
                v_amount := 0;
            END IF;

            IF v_amount > 0 THEN
                PERFORM award_quiz_reward(v_row.attempt_id, v_row.user_id, v_amount);

                UPDATE public.quiz_attempts
                   SET kori_earned = v_amount
                 WHERE id = v_row.attempt_id;

                v_paid := v_paid + v_amount;
            END IF;

            v_winners := v_winners || jsonb_build_object(
                'rank', i,
                'user_id', v_row.user_id,
                'attempt_id', v_row.attempt_id,
                'score', v_row.score,
                'amount', v_amount
            );
        END LOOP;
    END IF;

    v_settlement := jsonb_build_object(
        'pool', v_pool,
        'base_pool', v_base,
        'entries', v_entries,
        'rake', v_rake,
        'paid', v_paid,
        'winners', v_winners,
        'settled_at', CURRENT_TIMESTAMP
    );

    UPDATE public.quizzes
       SET settled_at = CURRENT_TIMESTAMP,
           prize_pool = v_pool - v_paid - v_rake,
           settlement = v_settlement,
           updated_at = CURRENT_TIMESTAMP
     WHERE id = p_quiz_id;

    RETURN jsonb_build_object(
        'already_settled', FALSE,
        'settlement', v_settlement
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION settle_quiz_round(UUID)
    IS 'Settle a closed round exactly once: top 3 split (prize_pool - rake) 50/30/20. Rake applies to entry money only, never to base_pool.';
