/**
 * Design Pattern: Repository
 * Data access layer for quizzes, questions, attempts, and answers.
 */

const db = require('../config/database');

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
                creator:created_by (id, username, full_name, profile_picture_url),
                source_content:source_content_id (id, title, slug, content_type)
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
                id, title, description, difficulty, entry_cost,
                reward_per_correct, total_questions, status,
                published_at, created_at,
                creator:created_by (id, username, full_name, profile_picture_url),
                source_content:source_content_id (id, title, slug, content_type)
            `)
            .eq('status', 'published')
            .order('published_at', { ascending: false });
        if (error) throw error;
        return data || [];
    }

    async findAllQuizzes() {
        const { data, error } = await db.getClient()
            .from('quizzes')
            .select(`
                id, title, description, difficulty, entry_cost,
                reward_per_correct, total_questions, status,
                published_at, created_at, ai_model,
                creator:created_by (id, username, full_name, profile_picture_url),
                source_content:source_content_id (id, title, slug, content_type)
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
            explanation: q.explanation || null
        }));

        const { data, error } = await client
            .from('quiz_questions')
            .insert(rows)
            .select();
        if (error) throw error;
        return data;
    }

    async findQuestionsByQuizId(quizId, { includeAnswers = false } = {}) {
        const columns = includeAnswers
            ? 'id, quiz_id, position, question_text, options, correct_index, explanation'
            : 'id, quiz_id, position, question_text, options';

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

    async findAttemptById(attemptId) {
        const { data, error } = await db.getClient()
            .from('quiz_attempts')
            .select(`
                *,
                quiz:quiz_id (id, title, entry_cost, reward_per_correct, total_questions, time_limit_seconds)
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
                quiz:quiz_id (id, title, difficulty)
            `)
            .eq('user_id', userId)
            .order('completed_at', { ascending: false, nullsFirst: false })
            .limit(limit);
        if (error) throw error;
        return data || [];
    }

    // ---- RPC wrappers ------------------------------------------------------

    async startAttempt(quizId, userId) {
        const { data, error } = await db.getClient().rpc('start_quiz_attempt', {
            p_quiz_id: quizId,
            p_user_id: userId
        });
        if (error) throw error;
        const row = Array.isArray(data) ? data[0] : data;
        if (!row) throw new Error('Could not create attempt');
        return { attemptId: row.attempt_id, balanceAfter: Number(row.balance_after) };
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

module.exports = new QuizRepository();
