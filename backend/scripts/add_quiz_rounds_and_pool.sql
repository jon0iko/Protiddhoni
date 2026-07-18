-- ============================================================================
-- Migration: scheduled competitive quiz ROUNDS with a real Kori prize pool
--
-- Turns the old "pay-per-correct" quiz into a scheduled competitive round:
--   * A round has a type (general / exam), a topic, and an open/close window.
--   * Entering the round debits the player's wallet INTO the round's prize_pool
--     (previously the entry fee vanished — from_wallet -> NULL with no sink).
--   * When the window closes the round is settled exactly once: the top 3
--     finishers split (pool - rake) 50/30/20 and are paid from the pool.
--
-- Entering and starting are now two separate steps, so a player can pay in,
-- watch the room leaderboard, and press Start when they are ready.
--
-- NAMING NOTE (deliberate deviation, documented):
--   The old `start_quiz_attempt` RPC is left in place untouched so any
--   in-flight deployment keeps working. The new entry path is a NEW function
--   `enter_quiz_round`, because its semantics (idempotent, pool-crediting,
--   window-checked, creates a row in status 'entered') differ enough from the
--   old one that reusing the name would be actively misleading in the DB.
--   Application code only calls `enter_quiz_round`.
--
-- Idempotent — safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Round columns on quizzes
-- ---------------------------------------------------------------------------
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS quiz_type VARCHAR(20) NOT NULL DEFAULT 'general';
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS exam_category VARCHAR(50);
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS opens_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS closes_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS prize_pool DECIMAL(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS rake_bps INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS settlement JSONB;

-- Questions are now generated from a topic, not a pasted passage.
ALTER TABLE public.quizzes ALTER COLUMN source_material DROP NOT NULL;

DO $$ BEGIN
    ALTER TABLE public.quizzes
        ADD CONSTRAINT quizzes_quiz_type_check CHECK (quiz_type IN ('general', 'exam'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.quizzes
        ADD CONSTRAINT quizzes_prize_pool_check CHECK (prize_pool >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.quizzes
        ADD CONSTRAINT quizzes_rake_bps_check CHECK (rake_bps >= 0 AND rake_bps <= 10000);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON COLUMN public.quizzes.quiz_type     IS 'general = open literary knowledge; exam = recruitment-exam style';
COMMENT ON COLUMN public.quizzes.exam_category IS 'Sub-category when quiz_type = exam (BCS, Bank Job, ...)';
COMMENT ON COLUMN public.quizzes.topic         IS 'Topic the AI generates questions about (replaces source_material)';
COMMENT ON COLUMN public.quizzes.prize_pool    IS 'Kori collected from entries, minus anything already paid out';
COMMENT ON COLUMN public.quizzes.rake_bps      IS 'House cut in basis points (100 = 1%) withheld at settlement';
COMMENT ON COLUMN public.quizzes.settled_at    IS 'Set exactly once by settle_quiz_round(); the double-payout guard';
COMMENT ON COLUMN public.quizzes.settlement    IS 'Frozen settlement record: {pool, rake, paid, winners[]}';

CREATE INDEX IF NOT EXISTS idx_quizzes_quiz_type ON public.quizzes(quiz_type);
CREATE INDEX IF NOT EXISTS idx_quizzes_round_window ON public.quizzes(status, opens_at, closes_at);

-- ---------------------------------------------------------------------------
-- 2. Per-question language, so one round can mix Bangla and English
-- ---------------------------------------------------------------------------
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS language VARCHAR(5);
COMMENT ON COLUMN public.quiz_questions.language IS 'bn | en — nullable; a single quiz may mix both';

-- ---------------------------------------------------------------------------
-- 3. Widen the attempt status CHECK to include 'entered'
--    ('entered' = paid into the pool but has not pressed Start yet)
-- ---------------------------------------------------------------------------
ALTER TABLE public.quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_status_check;

DO $$ BEGIN
    ALTER TABLE public.quiz_attempts
        ADD CONSTRAINT quiz_attempts_status_check
        CHECK (status IN ('entered', 'in_progress', 'completed', 'abandoned'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_status ON public.quiz_attempts(quiz_id, status);

-- ---------------------------------------------------------------------------
-- 4. RPC — enter a round (charge Kori, credit the pool, reserve a seat)
--
-- Idempotent: a second call by the same user returns the existing attempt and
-- charges nothing. Refuses late joiners who could not physically finish inside
-- the round window, so nobody pays in and ends up unrankable.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION enter_quiz_round(
    p_quiz_id UUID,
    p_user_id UUID
) RETURNS TABLE(attempt_id UUID, balance_after DECIMAL, already_entered BOOLEAN) AS $$
DECLARE
    v_quiz RECORD;
    v_wallet_id UUID;
    v_wallet_balance DECIMAL;
    v_attempt_id UUID;
    v_reference VARCHAR;
BEGIN
    SELECT id, entry_cost, status, total_questions, opens_at, closes_at,
           settled_at, time_limit_seconds
      INTO v_quiz
      FROM public.quizzes
     WHERE id = p_quiz_id
     FOR UPDATE;

    IF v_quiz.id IS NULL THEN
        RAISE EXCEPTION 'Quiz not found';
    END IF;

    -- Idempotency first: never charge twice, even outside the window.
    SELECT id INTO v_attempt_id
      FROM public.quiz_attempts
     WHERE quiz_id = p_quiz_id AND user_id = p_user_id;

    IF v_attempt_id IS NOT NULL THEN
        SELECT balance INTO v_wallet_balance FROM public.wallets WHERE user_id = p_user_id;
        attempt_id := v_attempt_id;
        balance_after := COALESCE(v_wallet_balance, 0);
        already_entered := TRUE;
        RETURN NEXT;
        RETURN;
    END IF;

    IF v_quiz.status <> 'published' THEN
        RAISE EXCEPTION 'Quiz is not available';
    END IF;

    IF v_quiz.total_questions <= 0 THEN
        RAISE EXCEPTION 'Quiz has no questions';
    END IF;

    IF v_quiz.settled_at IS NOT NULL THEN
        RAISE EXCEPTION 'Round is already settled';
    END IF;

    IF v_quiz.opens_at IS NOT NULL AND CURRENT_TIMESTAMP < v_quiz.opens_at THEN
        RAISE EXCEPTION 'Round has not opened yet';
    END IF;

    IF v_quiz.closes_at IS NOT NULL AND CURRENT_TIMESTAMP >= v_quiz.closes_at THEN
        RAISE EXCEPTION 'Round is closed';
    END IF;

    -- A player who cannot finish before the round closes must not be allowed
    -- to pay in — they would be charged and then be unrankable.
    IF v_quiz.closes_at IS NOT NULL
       AND v_quiz.time_limit_seconds IS NOT NULL
       AND v_quiz.time_limit_seconds > 0
       AND CURRENT_TIMESTAMP + make_interval(secs => v_quiz.time_limit_seconds) > v_quiz.closes_at
    THEN
        RAISE EXCEPTION 'Not enough time left in this round to play it';
    END IF;

    SELECT id, balance INTO v_wallet_id, v_wallet_balance
      FROM public.wallets
     WHERE user_id = p_user_id
     FOR UPDATE;

    IF v_wallet_id IS NULL THEN
        RAISE EXCEPTION 'Wallet not found';
    END IF;

    IF v_wallet_balance < v_quiz.entry_cost THEN
        RAISE EXCEPTION 'Insufficient Kori balance';
    END IF;

    IF v_quiz.entry_cost > 0 THEN
        UPDATE public.wallets
           SET balance = balance - v_quiz.entry_cost,
               updated_at = CURRENT_TIMESTAMP
         WHERE id = v_wallet_id;

        v_reference := 'QUIZ-ENTRY-' || p_quiz_id::text || '-' || p_user_id::text;

        INSERT INTO public.kori_transactions (
            from_wallet_id, to_wallet_id, amount, transaction_type,
            status, reference_id, metadata, completed_at
        ) VALUES (
            v_wallet_id, NULL, v_quiz.entry_cost, 'quiz_reward',
            'completed', v_reference,
            jsonb_build_object('quizId', p_quiz_id, 'flow', 'pool_entry'),
            CURRENT_TIMESTAMP
        );

        UPDATE public.quizzes
           SET prize_pool = prize_pool + v_quiz.entry_cost,
               updated_at = CURRENT_TIMESTAMP
         WHERE id = p_quiz_id;
    END IF;

    INSERT INTO public.quiz_attempts (
        quiz_id, user_id, total_questions, kori_spent, status, started_at
    ) VALUES (
        p_quiz_id, p_user_id, v_quiz.total_questions, v_quiz.entry_cost, 'entered', NULL
    ) RETURNING id INTO v_attempt_id;

    SELECT balance INTO v_wallet_balance FROM public.wallets WHERE id = v_wallet_id;

    attempt_id := v_attempt_id;
    balance_after := v_wallet_balance;
    already_entered := FALSE;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION enter_quiz_round(UUID, UUID)
    IS 'Idempotently charge entry_cost into the round prize pool and reserve a seat (status=entered).';

-- ---------------------------------------------------------------------------
-- 5. RPC — pay a single winner.
--
-- CHANGED: reference prefix is now 'QUIZ-PAYOUT-' instead of 'QUIZ-REWARD-'.
-- kori_transactions.reference_id is UNIQUE and legacy per-correct-answer
-- rewards already occupy 'QUIZ-REWARD-<attempt_id>'. Reusing the old prefix
-- would make settlement throw on any quiz that was played before this
-- migration. This rename is REQUIRED, not cosmetic.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION award_quiz_reward(
    p_attempt_id UUID,
    p_user_id UUID,
    p_amount DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    v_wallet_id UUID;
    v_new_balance DECIMAL;
    v_quiz_id UUID;
    v_reference VARCHAR;
BEGIN
    IF p_amount <= 0 THEN
        RETURN 0;
    END IF;

    SELECT quiz_id INTO v_quiz_id
      FROM public.quiz_attempts
     WHERE id = p_attempt_id AND user_id = p_user_id;

    IF v_quiz_id IS NULL THEN
        RAISE EXCEPTION 'Attempt not found';
    END IF;

    SELECT id INTO v_wallet_id
      FROM public.wallets
     WHERE user_id = p_user_id
     FOR UPDATE;

    IF v_wallet_id IS NULL THEN
        RAISE EXCEPTION 'Wallet not found';
    END IF;

    UPDATE public.wallets
       SET balance = balance + p_amount,
           updated_at = CURRENT_TIMESTAMP
     WHERE id = v_wallet_id
    RETURNING balance INTO v_new_balance;

    v_reference := 'QUIZ-PAYOUT-' || p_attempt_id::text;

    INSERT INTO public.kori_transactions (
        from_wallet_id, to_wallet_id, amount, transaction_type,
        status, reference_id, metadata, completed_at
    ) VALUES (
        NULL, v_wallet_id, p_amount, 'quiz_reward',
        'completed', v_reference,
        jsonb_build_object('attemptId', p_attempt_id, 'quizId', v_quiz_id, 'flow', 'pool_payout'),
        CURRENT_TIMESTAMP
    );

    RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION award_quiz_reward(UUID, UUID, DECIMAL)
    IS 'Credit a prize-pool payout to a winner. reference_id QUIZ-PAYOUT-<attempt_id> is the UNIQUE double-pay guard.';

-- ---------------------------------------------------------------------------
-- 6. RPC — settle a closed round exactly once.
--
-- Ranks completed attempts, pays the top 3 a 50/30/20 split of (pool - rake),
-- and freezes the result on the quiz row. The last winner receives the exact
-- arithmetic remainder, so the sum of payouts can never exceed the pool no
-- matter how the weights round.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION settle_quiz_round(p_quiz_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_quiz RECORD;
    v_pool DECIMAL(12, 2);
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
    -- Row lock: two concurrent settle attempts serialise here, and the loser
    -- sees settled_at already set.
    SELECT id, prize_pool, rake_bps, closes_at, settled_at, settlement, title
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
    v_rake := ROUND(v_pool * COALESCE(v_quiz.rake_bps, 0) / 10000.0, 2);
    IF v_rake > v_pool THEN
        v_rake := v_pool;
    END IF;
    v_distributable := v_pool - v_rake;

    SELECT COUNT(*) INTO v_winner_count FROM (
        SELECT id
          FROM public.quiz_attempts
         WHERE quiz_id = p_quiz_id AND status = 'completed'
         ORDER BY score DESC, duration_ms ASC NULLS LAST, completed_at ASC
         LIMIT 3
    ) top;

    -- Renormalise the weights when fewer than three players finished.
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
                -- Last winner takes the exact remainder: overpayment is
                -- arithmetically impossible regardless of rounding.
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
    IS 'Settle a closed round exactly once: pay the top 3 a 50/30/20 split of (prize_pool - rake) and freeze the result.';

-- ---------------------------------------------------------------------------
-- 7. Grants (ignored if the Supabase roles are absent, e.g. plain Postgres)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
    GRANT EXECUTE ON FUNCTION enter_quiz_round(UUID, UUID) TO authenticated, service_role;
    GRANT EXECUTE ON FUNCTION settle_quiz_round(UUID) TO authenticated, service_role;
    GRANT EXECUTE ON FUNCTION award_quiz_reward(UUID, UUID, DECIMAL) TO authenticated, service_role;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
