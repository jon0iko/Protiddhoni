-- ============================================================================
-- Quiz Feature Schema
-- Admin-curated quiz material → AI-generated questions → users pay Kori to play
-- → score recorded for a global leaderboard.
-- ============================================================================

-- 1. Quizzes Table — created by admins
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    source_material TEXT NOT NULL,           -- The raw text the AI builds questions from
    difficulty VARCHAR(20) NOT NULL DEFAULT 'medium'
        CHECK (difficulty IN ('easy', 'medium', 'hard')),
    entry_cost DECIMAL(12, 2) NOT NULL DEFAULT 5.00 CHECK (entry_cost >= 0),
    reward_per_correct DECIMAL(12, 2) NOT NULL DEFAULT 2.00 CHECK (reward_per_correct >= 0),
    total_questions INTEGER NOT NULL DEFAULT 0 CHECK (total_questions >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'published', 'archived')),
    ai_model VARCHAR(100),                   -- Which Gemini model generated questions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_quizzes_status ON public.quizzes(status);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_by ON public.quizzes(created_by);
CREATE INDEX IF NOT EXISTS idx_quizzes_published_at ON public.quizzes(published_at DESC);

-- 2. Quiz Questions Table — AI-generated, 4-option MCQ
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,                  -- ["option A", "option B", "option C", "option D"]
    correct_index INTEGER NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(quiz_id, position)
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);

-- 3. Quiz Attempts Table — one row per user attempt
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,            -- # correct answers
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    kori_spent DECIMAL(12, 2) NOT NULL DEFAULT 0,
    kori_earned DECIMAL(12, 2) NOT NULL DEFAULT 0,
    duration_ms INTEGER,                          -- time taken to finish, used as tiebreaker
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(quiz_id, user_id)                     -- one attempt per user per quiz
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_score ON public.quiz_attempts(score DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed_at ON public.quiz_attempts(completed_at DESC);

-- 4. Quiz Answers Table — individual answers per attempt (for audit + replay)
CREATE TABLE IF NOT EXISTS public.quiz_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    selected_index INTEGER NOT NULL CHECK (selected_index >= 0 AND selected_index <= 3),
    is_correct BOOLEAN NOT NULL,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt_id ON public.quiz_answers(attempt_id);

-- 5. RPC — Atomically spend Kori to start an attempt.
-- Deducts entry_cost from user's wallet, logs a kori_transactions entry,
-- and creates the quiz_attempt row. Reuses the existing kori_transactions ledger.
CREATE OR REPLACE FUNCTION start_quiz_attempt(
    p_quiz_id UUID,
    p_user_id UUID
) RETURNS TABLE(attempt_id UUID, balance_after DECIMAL) AS $$
DECLARE
    v_wallet_id UUID;
    v_wallet_balance DECIMAL;
    v_entry_cost DECIMAL;
    v_status VARCHAR;
    v_total_questions INTEGER;
    v_attempt_id UUID;
    v_existing UUID;
    v_reference VARCHAR;
BEGIN
    -- Fetch quiz info
    SELECT entry_cost, status, total_questions
      INTO v_entry_cost, v_status, v_total_questions
      FROM public.quizzes
      WHERE id = p_quiz_id;

    IF v_entry_cost IS NULL THEN
        RAISE EXCEPTION 'Quiz not found';
    END IF;

    IF v_status <> 'published' THEN
        RAISE EXCEPTION 'Quiz is not available';
    END IF;

    IF v_total_questions <= 0 THEN
        RAISE EXCEPTION 'Quiz has no questions';
    END IF;

    -- Block repeat attempts
    SELECT id INTO v_existing
      FROM public.quiz_attempts
      WHERE quiz_id = p_quiz_id AND user_id = p_user_id;

    IF v_existing IS NOT NULL THEN
        RAISE EXCEPTION 'You have already attempted this quiz';
    END IF;

    -- Lock wallet for balance check + deduction
    SELECT id, balance INTO v_wallet_id, v_wallet_balance
      FROM public.wallets
      WHERE user_id = p_user_id
      FOR UPDATE;

    IF v_wallet_id IS NULL THEN
        RAISE EXCEPTION 'Wallet not found';
    END IF;

    IF v_wallet_balance < v_entry_cost THEN
        RAISE EXCEPTION 'Insufficient Kori balance';
    END IF;

    -- Charge entry fee (only if > 0)
    IF v_entry_cost > 0 THEN
        UPDATE public.wallets
           SET balance = balance - v_entry_cost,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = v_wallet_id;

        v_reference := 'QUIZ-ENTRY-' || p_quiz_id::text || '-' || p_user_id::text;

        INSERT INTO public.kori_transactions (
            from_wallet_id, to_wallet_id, amount, transaction_type,
            status, reference_id, metadata, completed_at
        ) VALUES (
            v_wallet_id, NULL, v_entry_cost, 'quiz_reward',
            'completed', v_reference,
            jsonb_build_object('quizId', p_quiz_id, 'flow', 'entry'),
            CURRENT_TIMESTAMP
        );
    END IF;

    -- Create attempt
    INSERT INTO public.quiz_attempts (
        quiz_id, user_id, total_questions, kori_spent, status, started_at
    ) VALUES (
        p_quiz_id, p_user_id, v_total_questions, v_entry_cost, 'in_progress', CURRENT_TIMESTAMP
    ) RETURNING id INTO v_attempt_id;

    -- Return new attempt and post-deduction balance
    SELECT balance INTO v_wallet_balance FROM public.wallets WHERE id = v_wallet_id;

    attempt_id := v_attempt_id;
    balance_after := v_wallet_balance;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- 6. RPC — Atomically credit Kori reward when an attempt is finished.
-- Caller passes the total Kori to award. Logs a ledger entry.
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

    v_reference := 'QUIZ-REWARD-' || p_attempt_id::text;

    INSERT INTO public.kori_transactions (
        from_wallet_id, to_wallet_id, amount, transaction_type,
        status, reference_id, metadata, completed_at
    ) VALUES (
        NULL, v_wallet_id, p_amount, 'quiz_reward',
        'completed', v_reference,
        jsonb_build_object('attemptId', p_attempt_id, 'quizId', v_quiz_id, 'flow', 'reward'),
        CURRENT_TIMESTAMP
    );

    RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;
