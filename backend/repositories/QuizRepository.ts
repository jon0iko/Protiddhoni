/**
 * Design Pattern: Repository
 * Data access layer for quiz rounds, questions, attempts, and answers.
 */

import db from '../config/database';

// Columns shared by the player-facing and admin-facing quiz listings.
const ROUND_COLUMNS = `
    id, title, description, difficulty, entry_cost,
    total_questions, status, quiz_type, exam_category, topic, language,
    opens_at, closes_at, prize_pool, base_pool, rake_bps, settled_at, settlement,
    time_limit_seconds, published_at, created_at
`;

class QuizRepository {
    // ---- Quiz CRUD ---------------------------------------------------------

    async createQuiz(quizData) {
        const { data, error } = await db.getClient()
            .from('quizzes')
            .insert(quizData)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async findQuizById(id) {
        const { data, error } = await db.getClient()
            .from('quizzes')
            .select(`
                *,
                creator:created_by (id, username, full_name, profile_picture_url)
            `)
            .eq('id', id)
            .single();
        if (error) return null;
        return data;
    }

    async updateQuiz(id, updates) {
        const { data, error } = await db.getClient()
            .from('quizzes')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async deleteQuiz(id) {
        const { error } = await db.getClient()
            .from('quizzes')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }

    async findPublishedQuizzes() {
        const { data, error } = await db.getClient()
            .from('quizzes')
            .select(`
                ${ROUND_COLUMNS},
                creator:created_by (id, username, full_name, profile_picture_url)
            `)
            .eq('status', 'published')
            .order('closes_at', { ascending: true, nullsFirst: false })
            .order('published_at', { ascending: false });
        if (error) throw error;
        return data || [];
    }

    async findAllQuizzes() {
        const { data, error } = await db.getClient()
            .from('quizzes')
            .select(`
                ${ROUND_COLUMNS}, ai_model,
                creator:created_by (id, username, full_name, profile_picture_url)
            `)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    }

    // ---- Questions ---------------------------------------------------------

    async replaceQuestions(quizId, questions) {
        const client = db.getClient();

        const { error: deleteError } = await client
            .from('quiz_questions')
            .delete()
            .eq('quiz_id', quizId);
        if (deleteError) throw deleteError;

        if (!questions.length) return [];

        const rows = questions.map((q, idx) => ({
            quiz_id: quizId,
            position: idx,
            question_text: q.question,
            options: q.options,
            correct_index: q.correctIndex,
            explanation: q.explanation || null,
            language: q.language || null
        }));

        const { data, error } = await client
            .from('quiz_questions')
            .insert(rows)
            .select();
        if (error) throw error;
        return data;
    }

    /**
     * Append AI-generated questions after the existing ones so an admin can
     * curate a round incrementally instead of losing prior edits.
     */
    async appendQuestions(quizId, questions) {
        if (!questions.length) return [];

        const startPosition = (await this.maxQuestionPosition(quizId)) + 1;
        const rows = questions.map((q, idx) => ({
            quiz_id: quizId,
            position: startPosition + idx,
            question_text: q.question,
            options: q.options,
            correct_index: q.correctIndex,
            explanation: q.explanation || null,
            language: q.language || null
        }));

        const { data, error } = await db.getClient()
            .from('quiz_questions')
            .insert(rows)
            .select();
        if (error) throw error;
        return data || [];
    }

    /** Highest position currently used by a quiz, or -1 when it has none. */
    async maxQuestionPosition(quizId): Promise<number> {
        const { data, error } = await db.getClient()
            .from('quiz_questions')
            .select('position')
            .eq('quiz_id', quizId)
            .order('position', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error) throw error;
        return data ? Number((data as any).position) : -1;
    }

    async insertQuestion(row) {
        const { data, error } = await db.getClient()
            .from('quiz_questions')
            .insert(row)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async deleteQuestion(questionId) {
        const { error } = await db.getClient()
            .from('quiz_questions')
            .delete()
            .eq('id', questionId);
        if (error) throw error;
        return true;
    }

    /**
     * Rewrite positions so they stay contiguous (0..n-1) after a deletion.
     * UNIQUE(quiz_id, position) forbids a naive in-place renumber, so we park
     * the rows in a high range first and then bring them down.
     */
    async compactQuestionPositions(quizId) {
        const client = db.getClient();
        const { data, error } = await client
            .from('quiz_questions')
            .select('id, position')
            .eq('quiz_id', quizId)
            .order('position', { ascending: true });
        if (error) throw error;

        const rows = data || [];
        const needsCompacting = rows.some((row: any, idx: number) => Number(row.position) !== idx);
        if (!needsCompacting) return rows;

        const OFFSET = 100000;
        for (const [idx, row] of rows.entries()) {
            const { error: parkError } = await client
                .from('quiz_questions')
                .update({ position: OFFSET + idx })
                .eq('id', (row as any).id);
            if (parkError) throw parkError;
        }
        for (const [idx, row] of rows.entries()) {
            const { error: setError } = await client
                .from('quiz_questions')
                .update({ position: idx })
                .eq('id', (row as any).id);
            if (setError) throw setError;
        }
        return rows;
    }

    async countQuestions(quizId): Promise<number> {
        const { count, error } = await db.getClient()
            .from('quiz_questions')
            .select('id', { count: 'exact', head: true })
            .eq('quiz_id', quizId);
        if (error) throw error;
        return count || 0;
    }

    async findQuestionsByQuizId(quizId: string, { includeAnswers = false }: { includeAnswers?: boolean } = {}): Promise<any[]> {
        const columns = includeAnswers
            ? 'id, quiz_id, position, question_text, options, correct_index, explanation, language'
            : 'id, quiz_id, position, question_text, options, language';

        const { data, error } = await db.getClient()
            .from('quiz_questions')
            .select(columns)
            .eq('quiz_id', quizId)
            .order('position', { ascending: true });
        if (error) throw error;
        return data || [];
    }

    async findQuestionById(questionId) {
        const { data, error } = await db.getClient()
            .from('quiz_questions')
            .select('*')
            .eq('id', questionId)
            .single();
        if (error) return null;
        return data;
    }

    // ---- Attempts ----------------------------------------------------------

    async findAttempt(quizId, userId) {
        const { data, error } = await db.getClient()
            .from('quiz_attempts')
            .select('*')
            .eq('quiz_id', quizId)
            .eq('user_id', userId)
            .maybeSingle();
        if (error) throw error;
        return data;
    }

    /**
     * One query for "which of these rounds has this user already entered".
     * Replaces the per-quiz lookup that made the quiz list O(n) round trips.
     */
    async findAttemptsForQuizzes(quizIds: string[], userId: string): Promise<Map<string, any>> {
        if (!quizIds.length) return new Map();
        const { data, error } = await db.getClient()
            .from('quiz_attempts')
            .select('id, quiz_id, status, score, correct_answers, kori_spent, kori_earned, completed_at')
            .eq('user_id', userId)
            .in('quiz_id', quizIds);
        if (error) throw error;
        return new Map((data || []).map((row: any) => [row.quiz_id, row]));
    }

    /** Participant counts per round, for the "players joined" badge. */
    async countAttemptsForQuizzes(quizIds: string[]): Promise<Map<string, number>> {
        if (!quizIds.length) return new Map();
        const { data, error } = await db.getClient()
            .from('quiz_attempts')
            .select('quiz_id')
            .in('quiz_id', quizIds);
        if (error) throw error;
        const counts = new Map<string, number>();
        for (const row of (data || []) as any[]) {
            counts.set(row.quiz_id, (counts.get(row.quiz_id) || 0) + 1);
        }
        return counts;
    }

    async countAttempts(quizId): Promise<number> {
        const { count, error } = await db.getClient()
            .from('quiz_attempts')
            .select('id', { count: 'exact', head: true })
            .eq('quiz_id', quizId);
        if (error) throw error;
        return count || 0;
    }

    async findParticipantUserIds(quizId): Promise<string[]> {
        const { data, error } = await db.getClient()
            .from('quiz_attempts')
            .select('user_id')
            .eq('quiz_id', quizId);
        if (error) throw error;
        return Array.from(new Set((data || []).map((row: any) => row.user_id)));
    }

    async findAttemptById(attemptId) {
        const { data, error } = await db.getClient()
            .from('quiz_attempts')
            .select(`
                *,
                quiz:quiz_id (id, title, entry_cost, total_questions, time_limit_seconds, closes_at, settled_at, status, opens_at)
            `)
            .eq('id', attemptId)
            .single();
        if (error) return null;
        return data;
    }

    // Inline question editor — only patches the allowed columns.
    async updateQuestion(id, updates) {
        const { data, error } = await db.getClient()
            .from('quiz_questions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async updateAttempt(attemptId, updates) {
        const { data, error } = await db.getClient()
            .from('quiz_attempts')
            .update(updates)
            .eq('id', attemptId)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async insertAnswers(rows) {
        if (!rows.length) return [];
        const { data, error } = await db.getClient()
            .from('quiz_answers')
            .insert(rows)
            .select();
        if (error) throw error;
        return data;
    }

    async findAnswersByAttempt(attemptId) {
        const { data, error } = await db.getClient()
            .from('quiz_answers')
            .select('*')
            .eq('attempt_id', attemptId);
        if (error) throw error;
        return data || [];
    }

    async findAttemptsByUser(userId, { limit = 25 } = {}) {
        const { data, error } = await db.getClient()
            .from('quiz_attempts')
            .select(`
                id, score, total_questions, correct_answers,
                kori_spent, kori_earned, status, completed_at, started_at,
                quiz:quiz_id (id, title, difficulty, quiz_type, exam_category, closes_at, settled_at)
            `)
            .eq('user_id', userId)
            .order('completed_at', { ascending: false, nullsFirst: false })
            .limit(limit);
        if (error) throw error;
        return data || [];
    }

    // ---- RPC wrappers ------------------------------------------------------

    /**
     * Charge the entry fee into the round's prize pool and reserve a seat.
     * Idempotent server-side: a repeat call returns the existing attempt.
     */
    async enterRound(quizId, userId) {
        const { data, error } = await db.getClient().rpc('enter_quiz_round', {
            p_quiz_id: quizId,
            p_user_id: userId
        });
        if (error) throw error;
        const row = Array.isArray(data) ? data[0] : data;
        if (!row) throw new Error('Could not enter round');
        return {
            attemptId: row.attempt_id,
            balanceAfter: Number(row.balance_after),
            alreadyEntered: Boolean(row.already_entered)
        };
    }

    async awardReward(attemptId, userId, amount) {
        const { data, error } = await db.getClient().rpc('award_quiz_reward', {
            p_attempt_id: attemptId,
            p_user_id: userId,
            p_amount: amount
        });
        if (error) throw error;
        return Number(data);
    }

    /**
     * Settle a closed round. Deliberately has NO "RPC missing" fallback — a
     * silent no-op on a payout is far worse than a loud failure.
     */
    async settleRound(quizId) {
        const { data, error } = await db.getClient().rpc('settle_quiz_round', {
            p_quiz_id: quizId
        });
        if (error) throw error;
        const payload = Array.isArray(data) ? data[0] : data;
        return {
            alreadySettled: Boolean(payload?.already_settled),
            settlement: payload?.settlement || null
        };
    }

    // ---- Leaderboard -------------------------------------------------------

    async globalLeaderboard({ limit = 50 } = {}) {
        // Aggregate completed attempts → total Kori earned, total correct,
        // games played, best single-game score.
        const { data, error } = await db.getClient()
            .from('quiz_attempts')
            .select(`
                user_id,
                score,
                correct_answers,
                kori_earned,
                duration_ms,
                completed_at,
                user:user_id (id, username, full_name, profile_picture_url)
            `)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(1000);
        if (error) throw error;

        const buckets = new Map();
        for (const row of data || []) {
            const id = row.user_id;
            const entry = buckets.get(id) || {
                user: row.user,
                totalScore: 0,
                totalCorrect: 0,
                totalKori: 0,
                gamesPlayed: 0,
                bestScore: 0,
                avgDurationMs: 0,
                _durationSum: 0,
                _durationCount: 0
            };
            entry.totalScore += row.score || 0;
            entry.totalCorrect += row.correct_answers || 0;
            entry.totalKori += Number(row.kori_earned || 0);
            entry.gamesPlayed += 1;
            entry.bestScore = Math.max(entry.bestScore, row.score || 0);
            if (Number.isFinite(row.duration_ms)) {
                entry._durationSum += row.duration_ms;
                entry._durationCount += 1;
            }
            buckets.set(id, entry);
        }

        const ranked = Array.from(buckets.values())
            .map((entry) => {
                const avgDurationMs = entry._durationCount > 0
                    ? Math.round(entry._durationSum / entry._durationCount)
                    : null;
                delete entry._durationSum;
                delete entry._durationCount;
                return { ...entry, avgDurationMs };
            })
            .sort((a, b) => {
                if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
                if (b.totalKori !== a.totalKori) return b.totalKori - a.totalKori;
                if ((a.avgDurationMs ?? Infinity) !== (b.avgDurationMs ?? Infinity)) {
                    return (a.avgDurationMs ?? Infinity) - (b.avgDurationMs ?? Infinity);
                }
                return 0;
            })
            .slice(0, limit)
            .map((entry, index) => ({ rank: index + 1, ...entry }));

        return ranked;
    }

    async quizLeaderboard(quizId, { limit = 25 } = {}) {
        const { data, error } = await db.getClient()
            .from('quiz_attempts')
            .select(`
                id, score, correct_answers, kori_earned, duration_ms, completed_at,
                user:user_id (id, username, full_name, profile_picture_url)
            `)
            .eq('quiz_id', quizId)
            .eq('status', 'completed')
            .order('score', { ascending: false })
            .order('duration_ms', { ascending: true, nullsFirst: false })
            .limit(limit);
        if (error) throw error;
        return (data || []).map((entry, index) => ({ rank: index + 1, ...entry }));
    }
}

export default new QuizRepository();
