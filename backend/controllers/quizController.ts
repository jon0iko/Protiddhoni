import type { Request, Response, NextFunction } from 'express';
/**
 * Quiz Controller
 *
 * Quizzes are SCHEDULED COMPETITIVE ROUNDS:
 *   admin schedules a round (type + topic + window + entry cost)
 *   -> Gemini writes the questions, admin curates them
 *   -> players pay Kori to ENTER, which grows the round's prize pool
 *   -> players START and play inside the window
 *   -> when the window closes the round is settled once and the top 3
 *      split the pool 50/30/20.
 *
 * Nothing is paid out at submit time — kori_earned stays 0 until settlement.
 */

import QuizRepository from '../repositories/QuizRepository';
import geminiService from '../services/geminiService';
import notificationService from '../services/notificationService';
import WalletService from '../services/walletService';
import logger from '../config/logger';
import { randomSeed, seededShuffle, seededIndexPermutation, deriveSeed } from '../utils/shuffle';
import { deriveRoundPhase, isSettlementDue, secondsUntil } from '../utils/quizRound';

// Grace period (seconds) added to the time limit before we reject a submission
// — covers network latency between client clock and server clock.
const SUBMIT_GRACE_SECONDS = 5;

const DEFAULT_QUESTION_COUNT = 5;

const QUIZ_TYPES = ['general', 'exam'] as const;
const LANGUAGES = ['bn', 'en', 'mixed'] as const;

// ---- Round helpers ---------------------------------------------------------

/** Public shape of a round: raw columns + the derived phase and countdowns. */
function decorateRound(quiz: any, extras: Record<string, any> = {}) {
    const phase = deriveRoundPhase(quiz);
    return {
        ...quiz,
        entry_cost: Number(quiz.entry_cost ?? 0),
        prize_pool: Number(quiz.prize_pool ?? 0),
        rake_bps: Number(quiz.rake_bps ?? 0),
        phase,
        seconds_to_open: secondsUntil(quiz.opens_at),
        seconds_to_close: secondsUntil(quiz.closes_at),
        ...extras
    };
}

/**
 * Settle a round if its window has closed — the project has no cron/job runner,
 * so settlement is driven opportunistically by ordinary reads.
 *
 * ALWAYS call this fire-and-forget: never let a payout stall a page load.
 * Safety comes from the DB, not from this function: settle_quiz_round takes a
 * row lock, refuses to run twice via settled_at, and kori_transactions
 * .reference_id is UNIQUE, so a duplicate payout cannot be written even if two
 * requests race.
 */
async function settleIfDue(quizId: string): Promise<void> {
    try {
        const quiz = await QuizRepository.findQuizById(quizId);
        if (!quiz || !isSettlementDue(quiz)) return;

        const result = await QuizRepository.settleRound(quizId);
        if (result.alreadySettled) return;

        // Only the request that actually performed the settlement reaches this
        // point, so notifications can never fire twice.
        await announceSettlement(quiz, result.settlement);
    } catch (error: any) {
        logger.error(`Auto-settlement failed for quiz ${quizId}:`, error?.message || error);
    }
}

/** Notify every participant, then each winner individually. */
async function announceSettlement(quiz: any, settlement: any): Promise<void> {
    try {
        const participants = await QuizRepository.findParticipantUserIds(quiz.id);
        await notificationService.notifyQuizFinished(participants, { id: quiz.id, title: quiz.title });

        const winners = Array.isArray(settlement?.winners) ? settlement.winners : [];
        for (const winner of winners) {
            const amount = Number(winner?.amount || 0);
            if (!winner?.user_id || amount <= 0) continue;
            await notificationService.notifyQuizPrize(
                winner.user_id,
                { id: quiz.id, title: quiz.title },
                Number(winner.rank),
                amount
            );
        }
    } catch (error: any) {
        logger.error(`Settlement notifications failed for quiz ${quiz.id}:`, error?.message || error);
    }
}

/** Kick off settlement without blocking the response. */
function settleInBackground(quizId: string): void {
    void settleIfDue(quizId);
}

function parseTimestamp(value: any): string | null | undefined {
    if (value === null || value === '') return null;
    if (value === undefined) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;
    return date.toISOString();
}

// ---- Admin endpoints -------------------------------------------------------

export const listAllQuizzes = async (req: Request, res: Response) => {
    try {
        const quizzes = await QuizRepository.findAllQuizzes();
        const counts = await QuizRepository.countAttemptsForQuizzes(quizzes.map((q: any) => q.id));
        const data = quizzes.map((quiz: any) =>
            decorateRound(quiz, { players_joined: counts.get(quiz.id) || 0 })
        );
        res.json({ success: true, data, count: data.length });
    } catch (error) {
        logger.error('List quizzes error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * POST /api/quizzes/admin
 * Schedule a round and have Gemini write the first batch of questions.
 */
export const createQuiz = async (req: Request, res: Response) => {
    try {
        const {
            title,
            description,
            quiz_type = 'general',
            exam_category = null,
            topic,
            difficulty = 'medium',
            entry_cost = 5,
            rake_bps = 0,
            question_count = DEFAULT_QUESTION_COUNT,
            language = 'bn',
            opens_at,
            closes_at,
            time_limit_seconds
        } = req.body || {};

        if (!title || !String(title).trim()) {
            return res.status(400).json({ success: false, error: 'Title is required' });
        }
        if (!QUIZ_TYPES.includes(quiz_type)) {
            return res.status(400).json({ success: false, error: 'Invalid quiz type' });
        }
        if (quiz_type === 'exam' && !exam_category) {
            return res.status(400).json({ success: false, error: 'Exam rounds need an exam category' });
        }
        if (!topic || String(topic).trim().length < 3) {
            return res.status(400).json({ success: false, error: 'A topic is required (at least 3 characters)' });
        }
        if (!['easy', 'medium', 'hard'].includes(difficulty)) {
            return res.status(400).json({ success: false, error: 'Invalid difficulty' });
        }
        if (!LANGUAGES.includes(language)) {
            return res.status(400).json({ success: false, error: 'Invalid language' });
        }
        if (!geminiService.isConfigured()) {
            return res.status(503).json({
                success: false,
                error: 'AI question generation is not configured. Set GEMINI_API_KEY on the backend.'
            });
        }

        const opensAt = parseTimestamp(opens_at);
        const closesAt = parseTimestamp(closes_at);
        if (opensAt === undefined && opens_at !== undefined) {
            return res.status(400).json({ success: false, error: 'Invalid opens_at' });
        }
        if (closesAt === undefined && closes_at !== undefined) {
            return res.status(400).json({ success: false, error: 'Invalid closes_at' });
        }
        if (opensAt && closesAt && new Date(closesAt) <= new Date(opensAt)) {
            return res.status(400).json({ success: false, error: 'closes_at must be after opens_at' });
        }

        const aiResult = await geminiService.generateQuizQuestions({
            title,
            topic,
            quizType: quiz_type,
            examCategory: exam_category,
            questionCount: question_count,
            difficulty,
            language
        });

        const quiz = await QuizRepository.createQuiz({
            created_by: req.user.id,
            title: String(title).trim(),
            description: description?.trim() || null,
            quiz_type,
            exam_category: quiz_type === 'exam' ? exam_category : null,
            topic: String(topic).trim(),
            difficulty,
            entry_cost: Math.max(0, Number(entry_cost) || 0),
            rake_bps: Math.max(0, Math.min(10000, Math.round(Number(rake_bps) || 0))),
            total_questions: aiResult.questions.length,
            status: 'draft',
            ai_model: aiResult.model,
            opens_at: opensAt ?? null,
            closes_at: closesAt ?? null,
            time_limit_seconds: Number(time_limit_seconds) > 0
                ? Math.max(10, Math.min(3600, Math.round(Number(time_limit_seconds))))
                : null
        });

        const questions = await QuizRepository.replaceQuestions(quiz.id, aiResult.questions);

        res.status(201).json({
            success: true,
            data: {
                quiz: decorateRound(quiz),
                questions
            }
        });
    } catch (error) {
        logger.error('Create quiz error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * POST /api/quizzes/admin/:id/regenerate
 * Generate more questions with AI. APPENDS by default so the admin's manual
 * edits survive; `replace: true` is only allowed on an untouched round.
 */
export const regenerateQuestions = async (req: Request, res: Response) => {
    try {
        const quiz = await QuizRepository.findQuizById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ success: false, error: 'Quiz not found' });
        }
        if (!geminiService.isConfigured()) {
            return res.status(503).json({
                success: false,
                error: 'AI question generation is not configured'
            });
        }

        const replace = req.body?.replace === true;

        // GUARD: replaceQuestions DELETEs the rows, and quiz_answers.question_id
        // CASCADEs — regenerating a round that has already been played would
        // silently destroy every submitted answer and unrank the players.
        if (replace) {
            const attemptCount = await QuizRepository.countAttempts(quiz.id);
            if (attemptCount > 0 || Number(quiz.prize_pool || 0) > 0) {
                return res.status(409).json({
                    success: false,
                    error: 'This round already has players or a prize pool — its questions can no longer be replaced. Append new questions instead.'
                });
            }
            if (quiz.status === 'published') {
                return res.status(409).json({
                    success: false,
                    error: 'Unpublish this round before replacing its questions'
                });
            }
        }

        const questionCount = Math.max(1, Number(req.body?.question_count) || DEFAULT_QUESTION_COUNT);
        const language = LANGUAGES.includes(req.body?.language) ? req.body.language : 'bn';

        const aiResult = await geminiService.generateQuizQuestions({
            title: quiz.title,
            topic: quiz.topic,
            quizType: quiz.quiz_type || 'general',
            examCategory: quiz.exam_category,
            questionCount,
            difficulty: quiz.difficulty,
            language
        });

        if (replace) {
            await QuizRepository.replaceQuestions(quiz.id, aiResult.questions);
        } else {
            await QuizRepository.appendQuestions(quiz.id, aiResult.questions);
        }

        const questions = await QuizRepository.findQuestionsByQuizId(quiz.id, { includeAnswers: true });
        const updated = await QuizRepository.updateQuiz(quiz.id, {
            total_questions: questions.length,
            ai_model: aiResult.model
        });

        res.json({
            success: true,
            data: {
                quiz: decorateRound(updated),
                questions,
                added: aiResult.questions.length,
                mode: replace ? 'replace' : 'append'
            }
        });
    } catch (error) {
        logger.error('Regenerate questions error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateQuizSettings = async (req: Request, res: Response) => {
    try {
        const quiz = await QuizRepository.findQuizById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ success: false, error: 'Quiz not found' });
        }

        const allowed = [
            'title', 'description', 'difficulty', 'status', 'time_limit_seconds',
            'quiz_type', 'exam_category', 'topic',
            'entry_cost', 'opens_at', 'closes_at', 'rake_bps'
        ];
        const updates: Record<string, any> = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }

        // Once the round has left 'scheduled' the economics are frozen — players
        // have already committed real Kori against the advertised terms.
        const phase = deriveRoundPhase(quiz);
        const economicKeys = ['entry_cost', 'opens_at', 'closes_at', 'rake_bps'];
        const touchedEconomics = economicKeys.filter((key) => updates[key] !== undefined);
        if (touchedEconomics.length && !['draft', 'scheduled'].includes(phase)) {
            return res.status(409).json({
                success: false,
                error: `Cannot change ${touchedEconomics.join(', ')} once the round is ${phase}`
            });
        }

        if (updates.entry_cost !== undefined) {
            updates.entry_cost = Math.max(0, Number(updates.entry_cost) || 0);
        }
        if (updates.rake_bps !== undefined) {
            updates.rake_bps = Math.max(0, Math.min(10000, Math.round(Number(updates.rake_bps) || 0)));
        }
        for (const key of ['opens_at', 'closes_at']) {
            if (updates[key] === undefined) continue;
            const parsed = parseTimestamp(updates[key]);
            if (parsed === undefined) {
                return res.status(400).json({ success: false, error: `Invalid ${key}` });
            }
            updates[key] = parsed;
        }
        const nextOpens = updates.opens_at !== undefined ? updates.opens_at : quiz.opens_at;
        const nextCloses = updates.closes_at !== undefined ? updates.closes_at : quiz.closes_at;
        if (nextOpens && nextCloses && new Date(nextCloses) <= new Date(nextOpens)) {
            return res.status(400).json({ success: false, error: 'closes_at must be after opens_at' });
        }

        if (updates.quiz_type !== undefined && !QUIZ_TYPES.includes(updates.quiz_type)) {
            return res.status(400).json({ success: false, error: 'Invalid quiz type' });
        }
        if (updates.quiz_type === 'general') {
            updates.exam_category = null;
        }
        if (updates.exam_category !== undefined && updates.exam_category !== null) {
            updates.exam_category = String(updates.exam_category).trim() || null;
        }
        if (updates.topic !== undefined) {
            updates.topic = updates.topic === null ? null : String(updates.topic).trim();
        }

        if (updates.time_limit_seconds !== undefined) {
            if (updates.time_limit_seconds === null || updates.time_limit_seconds === '' || Number(updates.time_limit_seconds) <= 0) {
                updates.time_limit_seconds = null; // 0/empty => no limit
            } else {
                const parsed = Math.max(10, Math.min(3600, Math.round(Number(updates.time_limit_seconds))));
                if (!Number.isFinite(parsed)) {
                    return res.status(400).json({ success: false, error: 'Invalid time limit' });
                }
                updates.time_limit_seconds = parsed;
            }
        }
        if (updates.difficulty !== undefined && !['easy', 'medium', 'hard'].includes(updates.difficulty)) {
            return res.status(400).json({ success: false, error: 'Invalid difficulty' });
        }
        if (updates.status !== undefined) {
            if (!['draft', 'published', 'archived'].includes(updates.status)) {
                return res.status(400).json({ success: false, error: 'Invalid status' });
            }
            if (updates.status === 'published') {
                if (!quiz.total_questions || quiz.total_questions <= 0) {
                    return res.status(400).json({
                        success: false,
                        error: 'Cannot publish a round with no questions'
                    });
                }
                if (!nextCloses) {
                    return res.status(400).json({
                        success: false,
                        error: 'Set a closing time before publishing — a round with no deadline can never be settled'
                    });
                }
                updates.published_at = new Date().toISOString();
            }
        }

        const updated = await QuizRepository.updateQuiz(quiz.id, updates);
        res.json({ success: true, data: decorateRound(updated) });
    } catch (error) {
        logger.error('Update quiz error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteQuiz = async (req: Request, res: Response) => {
    try {
        const quiz = await QuizRepository.findQuizById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ success: false, error: 'Quiz not found' });
        }
        await QuizRepository.deleteQuiz(quiz.id);
        res.json({ success: true, message: 'Quiz deleted' });
    } catch (error) {
        logger.error('Delete quiz error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getQuizForAdmin = async (req: Request, res: Response) => {
    try {
        const quiz = await QuizRepository.findQuizById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ success: false, error: 'Quiz not found' });
        }
        const [questions, playersJoined] = await Promise.all([
            QuizRepository.findQuestionsByQuizId(quiz.id, { includeAnswers: true }),
            QuizRepository.countAttempts(quiz.id)
        ]);
        res.json({
            success: true,
            data: {
                quiz: decorateRound(quiz, { players_joined: playersJoined }),
                questions
            }
        });
    } catch (error) {
        logger.error('Get quiz error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

interface QuestionPayload {
    question_text: string;
    options: string[];
    correct_index: number;
    explanation: string | null;
    language: string | null;
}

/** Shared validation for a manually authored question. */
function validateQuestionPayload(body: any): { error: string; value?: undefined } | { error?: undefined; value: QuestionPayload } {
    const { question_text, options, correct_index, explanation, language } = body || {};

    if (typeof question_text !== 'string' || !question_text.trim()) {
        return { error: 'Question text is required' };
    }
    if (!Array.isArray(options) || options.length !== 4) {
        return { error: 'Options must be an array of exactly 4 strings' };
    }
    const cleaned = options.map((o: any) => (typeof o === 'string' ? o.trim() : String(o ?? '').trim()));
    if (cleaned.some((o) => !o)) {
        return { error: 'All four options must be non-empty' };
    }
    const ci = Number(correct_index);
    if (!Number.isInteger(ci) || ci < 0 || ci > 3) {
        return { error: 'correct_index must be an integer between 0 and 3' };
    }
    if (language !== undefined && language !== null && !['bn', 'en'].includes(language)) {
        return { error: 'language must be bn or en' };
    }

    return {
        value: {
            question_text: question_text.trim(),
            options: cleaned,
            correct_index: ci,
            explanation: explanation === undefined || explanation === null || explanation === ''
                ? null
                : String(explanation).trim(),
            language: language || null
        }
    };
}

/**
 * POST /api/quizzes/admin/:id/questions
 * Author a question by hand, appended after the existing ones.
 */
export const createQuestion = async (req: Request, res: Response) => {
    try {
        const quiz = await QuizRepository.findQuizById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ success: false, error: 'Quiz not found' });
        }

        const parsed = validateQuestionPayload(req.body);
        if (parsed.error) {
            return res.status(400).json({ success: false, error: parsed.error });
        }

        const position = (await QuizRepository.maxQuestionPosition(quiz.id)) + 1;
        const question = await QuizRepository.insertQuestion({
            quiz_id: quiz.id,
            position,
            ...parsed.value
        });

        const total = await QuizRepository.countQuestions(quiz.id);
        const updated = await QuizRepository.updateQuiz(quiz.id, { total_questions: total });

        res.status(201).json({ success: true, data: { question, quiz: decorateRound(updated) } });
    } catch (error) {
        logger.error('Create question error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * DELETE /api/quizzes/admin/questions/:id
 * Remove a question and close the gap it leaves in the position sequence.
 */
export const deleteQuestion = async (req: Request, res: Response) => {
    try {
        const existing = await QuizRepository.findQuestionById(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, error: 'Question not found' });
        }

        const quiz = await QuizRepository.findQuizById(existing.quiz_id);
        if (quiz) {
            const attemptCount = await QuizRepository.countAttempts(quiz.id);
            if (attemptCount > 0) {
                return res.status(409).json({
                    success: false,
                    error: 'Players have already entered this round — its questions can no longer be deleted'
                });
            }
        }

        await QuizRepository.deleteQuestion(existing.id);
        await QuizRepository.compactQuestionPositions(existing.quiz_id);

        const total = await QuizRepository.countQuestions(existing.quiz_id);
        const updated = await QuizRepository.updateQuiz(existing.quiz_id, { total_questions: total });
        const questions = await QuizRepository.findQuestionsByQuizId(existing.quiz_id, { includeAnswers: true });

        res.json({ success: true, data: { quiz: decorateRound(updated), questions } });
    } catch (error) {
        logger.error('Delete question error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * PATCH /api/quizzes/admin/questions/:id
 * Inline edit a single question without disturbing the rest of the quiz.
 */
export const updateQuestion = async (req: Request, res: Response) => {
    try {
        const existing = await QuizRepository.findQuestionById(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, error: 'Question not found' });
        }

        const { question_text, options, correct_index, explanation, language } = req.body || {};
        const updates: Record<string, any> = {};

        if (question_text !== undefined) {
            if (typeof question_text !== 'string' || !question_text.trim()) {
                return res.status(400).json({ success: false, error: 'Question text is required' });
            }
            updates.question_text = question_text.trim();
        }

        if (options !== undefined) {
            if (!Array.isArray(options) || options.length !== 4) {
                return res.status(400).json({ success: false, error: 'Options must be an array of exactly 4 strings' });
            }
            const cleaned = options.map((o) => (typeof o === 'string' ? o.trim() : String(o ?? '').trim()));
            if (cleaned.some((o) => !o)) {
                return res.status(400).json({ success: false, error: 'All four options must be non-empty' });
            }
            updates.options = cleaned;
        }

        if (correct_index !== undefined) {
            const ci = Number(correct_index);
            if (!Number.isInteger(ci) || ci < 0 || ci > 3) {
                return res.status(400).json({ success: false, error: 'correct_index must be an integer between 0 and 3' });
            }
            updates.correct_index = ci;
        }

        if (explanation !== undefined) {
            updates.explanation = explanation === null || explanation === ''
                ? null
                : String(explanation).trim();
        }

        if (language !== undefined) {
            if (language !== null && !['bn', 'en'].includes(language)) {
                return res.status(400).json({ success: false, error: 'language must be bn or en' });
            }
            updates.language = language || null;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, error: 'No editable fields supplied' });
        }

        const updated = await QuizRepository.updateQuestion(existing.id, updates);
        res.json({ success: true, data: updated });
    } catch (error) {
        logger.error('Update question error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * POST /api/quizzes/admin/:id/settle
 * Manual override for the opportunistic auto-settlement.
 */
export const settleRoundAdmin = async (req: Request, res: Response) => {
    try {
        const quiz = await QuizRepository.findQuizById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ success: false, error: 'Quiz not found' });
        }

        const result = await QuizRepository.settleRound(quiz.id);
        if (!result.alreadySettled) {
            await announceSettlement(quiz, result.settlement);
        }

        res.json({
            success: true,
            data: {
                already_settled: result.alreadySettled,
                settlement: result.settlement
            }
        });
    } catch (error: any) {
        logger.error('Settle round error:', error);
        const message = error?.message || 'Settlement failed';
        if (message.includes('still open')) {
            return res.status(409).json({ success: false, error: 'Round is still open' });
        }
        if (message.includes('no closing time')) {
            return res.status(400).json({ success: false, error: 'This round has no closing time and cannot be settled' });
        }
        res.status(500).json({ success: false, error: message });
    }
};

// ---- Public / player endpoints --------------------------------------------

export const listPublishedQuizzes = async (req: Request, res: Response) => {
    try {
        const quizzes = await QuizRepository.findPublishedQuizzes();
        const quizIds = quizzes.map((q: any) => q.id);

        // Fire-and-forget settlement for any round whose window has closed.
        for (const quiz of quizzes) {
            if (isSettlementDue(quiz)) settleInBackground(quiz.id);
        }

        const counts = await QuizRepository.countAttemptsForQuizzes(quizIds);
        const attempts = req.user
            ? await QuizRepository.findAttemptsForQuizzes(quizIds, req.user.id)
            : new Map();

        const data = quizzes.map((quiz: any) => {
            const attempt = attempts.get(quiz.id);
            return decorateRound(quiz, {
                players_joined: counts.get(quiz.id) || 0,
                user_attempt: attempt
                    ? {
                        id: attempt.id,
                        status: attempt.status,
                        score: attempt.score,
                        correct_answers: attempt.correct_answers,
                        kori_earned: Number(attempt.kori_earned)
                    }
                    : null
            });
        });

        res.json({ success: true, data, count: data.length });
    } catch (error) {
        logger.error('List published quizzes error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getQuizPreview = async (req: Request, res: Response) => {
    try {
        const quiz = await QuizRepository.findQuizById(req.params.id);
        if (!quiz || quiz.status !== 'published') {
            return res.status(404).json({ success: false, error: 'Quiz not found' });
        }

        if (isSettlementDue(quiz)) settleInBackground(quiz.id);

        let userAttempt = null;
        if (req.user) {
            const attempt = await QuizRepository.findAttempt(quiz.id, req.user.id);
            if (attempt) {
                userAttempt = {
                    id: attempt.id,
                    status: attempt.status,
                    score: attempt.score,
                    correct_answers: attempt.correct_answers,
                    kori_spent: Number(attempt.kori_spent),
                    kori_earned: Number(attempt.kori_earned),
                    completed_at: attempt.completed_at
                };
            }
        }

        const playersJoined = await QuizRepository.countAttempts(quiz.id);

        res.json({
            success: true,
            data: {
                quiz: decorateRound({
                    id: quiz.id,
                    title: quiz.title,
                    description: quiz.description,
                    difficulty: quiz.difficulty,
                    entry_cost: quiz.entry_cost,
                    total_questions: quiz.total_questions,
                    time_limit_seconds: quiz.time_limit_seconds || null,
                    quiz_type: quiz.quiz_type,
                    exam_category: quiz.exam_category,
                    topic: quiz.topic,
                    opens_at: quiz.opens_at,
                    closes_at: quiz.closes_at,
                    prize_pool: quiz.prize_pool,
                    rake_bps: quiz.rake_bps,
                    settled_at: quiz.settled_at,
                    settlement: quiz.settlement,
                    status: quiz.status,
                    creator: quiz.creator,
                    published_at: quiz.published_at
                }, { players_joined: playersJoined }),
                user_attempt: userAttempt
            }
        });
    } catch (error) {
        logger.error('Get quiz preview error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * POST /api/quizzes/:id/enter
 * Charge the entry fee into the prize pool and reserve a seat. Idempotent —
 * a second call returns the existing entry and charges nothing.
 */
export const enterRound = async (req: Request, res: Response) => {
    try {
        const quiz = await QuizRepository.findQuizById(req.params.id);
        if (!quiz || quiz.status !== 'published') {
            return res.status(404).json({ success: false, error: 'Quiz not found' });
        }

        let entry;
        try {
            entry = await QuizRepository.enterRound(quiz.id, req.user.id);
        } catch (rpcError: any) {
            const message = rpcError?.message || 'Could not enter this round';
            if (message.includes('Insufficient')) {
                return res.status(402).json({ success: false, error: 'Insufficient Kori balance' });
            }
            if (message.includes('not opened')) {
                return res.status(409).json({ success: false, error: 'This round has not opened yet' });
            }
            if (message.includes('already settled') || message.includes('Round is closed')) {
                return res.status(409).json({ success: false, error: 'This round is closed' });
            }
            if (message.includes('Not enough time left')) {
                return res.status(409).json({
                    success: false,
                    error: 'Not enough time left in this round — entry is closed'
                });
            }
            if (message.includes('not available') || message.includes('no questions')) {
                return res.status(400).json({ success: false, error: 'This round is not available' });
            }
            throw rpcError;
        }

        const attempt = await QuizRepository.findAttempt(quiz.id, req.user.id);
        const fresh = await QuizRepository.findQuizById(quiz.id);
        const playersJoined = await QuizRepository.countAttempts(quiz.id);

        res.status(entry.alreadyEntered ? 200 : 201).json({
            success: true,
            data: {
                attempt_id: entry.attemptId,
                already_entered: entry.alreadyEntered,
                balance_after: entry.balanceAfter,
                attempt_status: attempt?.status ?? 'entered',
                prize_pool: Number(fresh?.prize_pool ?? 0),
                players_joined: playersJoined
            }
        });
    } catch (error) {
        logger.error('Enter round error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * POST /api/quizzes/:id/start
 * Flip an entered seat to in_progress and serve the shuffled questions.
 * Charges nothing — the money moved at /enter.
 */
export const startAttempt = async (req: Request, res: Response) => {
    try {
        const quiz = await QuizRepository.findQuizById(req.params.id);
        if (!quiz || quiz.status !== 'published') {
            return res.status(404).json({ success: false, error: 'Quiz not found' });
        }

        const phase = deriveRoundPhase(quiz);
        if (phase !== 'open') {
            return res.status(409).json({
                success: false,
                error: phase === 'scheduled'
                    ? 'This round has not opened yet'
                    : 'This round is closed'
            });
        }

        const attempt = await QuizRepository.findAttempt(quiz.id, req.user.id);
        if (!attempt) {
            return res.status(402).json({
                success: false,
                error: 'Confirm your entry before starting this round'
            });
        }
        if (attempt.status === 'completed') {
            return res.status(409).json({ success: false, error: 'You have already played this round' });
        }

        // Generate + persist per-attempt shuffle seed so questions / options
        // appear in a different order to every player while staying consistent
        // for this player across reloads. An in_progress attempt keeps its
        // original seed so a reload does not reshuffle mid-game.
        let seed = attempt.shuffle_seed != null ? Number(attempt.shuffle_seed) : null;
        const isResume = attempt.status === 'in_progress' && seed != null;

        if (!isResume) {
            seed = randomSeed();
            await QuizRepository.updateAttempt(attempt.id, {
                shuffle_seed: seed,
                status: 'in_progress',
                started_at: new Date().toISOString()
            });
        }

        const questions = await QuizRepository.findQuestionsByQuizId(quiz.id, { includeAnswers: true });
        const shuffledQuestions = seededShuffle(questions, seed).map((q) => {
            const perm = seededIndexPermutation(q.options.length, deriveSeed(seed, q.id));
            const shuffledOptions = perm.map((origIdx) => q.options[origIdx]);
            return {
                id: q.id,
                position: q.position,
                question_text: q.question_text,
                language: q.language || null,
                options: shuffledOptions
                // correct_index intentionally omitted
            };
        });

        const startedAt = isResume ? attempt.started_at : new Date().toISOString();

        res.status(201).json({
            success: true,
            data: {
                attempt_id: attempt.id,
                resumed: isResume,
                started_at: startedAt,
                quiz: {
                    id: quiz.id,
                    title: quiz.title,
                    difficulty: quiz.difficulty,
                    total_questions: quiz.total_questions,
                    time_limit_seconds: quiz.time_limit_seconds || null,
                    closes_at: quiz.closes_at
                },
                questions: shuffledQuestions
            }
        });
    } catch (error) {
        logger.error('Start attempt error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const submitAttempt = async (req: Request, res: Response) => {
    try {
        const attempt = await QuizRepository.findAttemptById(req.params.attemptId);
        if (!attempt) {
            return res.status(404).json({ success: false, error: 'Attempt not found' });
        }
        if (attempt.user_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }
        if (attempt.status === 'completed') {
            return res.status(409).json({ success: false, error: 'Attempt already submitted' });
        }
        if (attempt.status === 'entered') {
            return res.status(409).json({ success: false, error: 'Start this round before submitting' });
        }

        // ---- Time-limit awareness (non-destructive) ----
        // We still grade whatever answers the player managed to submit before the
        // clock ran out, so the answers they got right are always recorded and
        // shown in the review. A submission beyond the grace window is flagged
        // `expired` — it no longer wipes the result.
        let expired = false;
        let elapsedMs = null;
        const timeLimit = Number(attempt.quiz?.time_limit_seconds);
        if (Number.isFinite(timeLimit) && timeLimit > 0) {
            const startedMs = new Date(attempt.started_at).getTime();
            const elapsedSeconds = (Date.now() - startedMs) / 1000;
            elapsedMs = Math.round(elapsedSeconds * 1000);
            if (elapsedSeconds > timeLimit + SUBMIT_GRACE_SECONDS) {
                expired = true;
            }
        }

        const { answers, duration_ms } = req.body;
        const submittedAnswers = Array.isArray(answers) ? answers : [];

        const questions = await QuizRepository.findQuestionsByQuizId(attempt.quiz_id, { includeAnswers: true });
        const questionMap = new Map(questions.map((q) => [q.id, q]));

        // Recreate the per-attempt option permutation from the stored seed so we
        // can map the player's shuffled-space selection back to the original.
        const seed = attempt.shuffle_seed != null ? Number(attempt.shuffle_seed) : null;

        const answerRows = [];
        let correctCount = 0;
        for (const submitted of submittedAnswers) {
            const question = questionMap.get(submitted.question_id);
            if (!question) continue;
            const optionsLength = Array.isArray(question.options) ? question.options.length : 4;
            const selectedShuffled = Number(submitted.selected_index);
            if (!Number.isInteger(selectedShuffled) || selectedShuffled < 0 || selectedShuffled >= optionsLength) continue;

            // Map shuffled-space selection back to original index. If no seed
            // (legacy attempts created before this migration), treat as identity.
            let selectedOriginal = selectedShuffled;
            if (seed != null) {
                const perm = seededIndexPermutation(optionsLength, deriveSeed(seed, question.id));
                selectedOriginal = perm[selectedShuffled];
            }

            const isCorrect = selectedOriginal === question.correct_index;
            if (isCorrect) correctCount += 1;
            answerRows.push({
                attempt_id: attempt.id,
                question_id: question.id,
                selected_index: selectedOriginal, // always store original index
                is_correct: isCorrect
            });
        }

        if (answerRows.length) {
            await QuizRepository.insertAnswers(answerRows);
        }

        // NO PAYOUT HERE. The score is locked in and the round pays out in one
        // shot at settlement, so kori_earned stays 0 until settle_quiz_round
        // decides who placed top 3.
        const wallet = await WalletService.getWalletByUserId(req.user.id);
        const newBalance = wallet ? Number(wallet.balance) : null;

        const resolvedDuration = Number.isFinite(Number(duration_ms))
            ? Number(duration_ms)
            : (elapsedMs != null ? elapsedMs : null);

        const completed = await QuizRepository.updateAttempt(attempt.id, {
            score: correctCount,
            correct_answers: correctCount,
            duration_ms: resolvedDuration,
            status: 'completed',
            completed_at: new Date().toISOString()
        });

        // Build review payload exposing correct answers + user's selections.
        // Review always shows options in the ORIGINAL order so the user can
        // verify against the canonical question content.
        const answersById = new Map(answerRows.map((a) => [a.question_id, a]));
        const review = questions.map((q) => {
            const submitted = answersById.get(q.id);
            return {
                id: q.id,
                position: q.position,
                question_text: q.question_text,
                language: q.language || null,
                options: q.options,
                correct_index: q.correct_index,
                explanation: q.explanation,
                selected_index: submitted ? submitted.selected_index : null,
                is_correct: submitted ? submitted.is_correct : false
            };
        });

        res.json({
            success: true,
            data: {
                attempt: completed,
                correct_answers: correctCount,
                total_questions: questions.length,
                kori_earned: 0,
                payout_pending: true,
                closes_at: attempt.quiz?.closes_at || null,
                balance_after: newBalance,
                expired,
                review
            }
        });
    } catch (error) {
        logger.error('Submit attempt error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getAttempt = async (req: Request, res: Response) => {
    try {
        const attempt = await QuizRepository.findAttemptById(req.params.attemptId);
        if (!attempt) {
            return res.status(404).json({ success: false, error: 'Attempt not found' });
        }
        if (attempt.user_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        const questions = await QuizRepository.findQuestionsByQuizId(attempt.quiz_id, { includeAnswers: true });
        const answers = await QuizRepository.findAnswersByAttempt(attempt.id);
        const answersById = new Map(answers.map((a) => [a.question_id, a]));

        const review = questions.map((q) => {
            const submitted = answersById.get(q.id);
            return {
                id: q.id,
                position: q.position,
                question_text: q.question_text,
                language: q.language || null,
                options: q.options,
                correct_index: q.correct_index,
                explanation: q.explanation,
                selected_index: submitted ? submitted.selected_index : null,
                is_correct: submitted ? submitted.is_correct : false
            };
        });

        res.json({ success: true, data: { attempt, review } });
    } catch (error) {
        logger.error('Get attempt error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ---- Leaderboard -----------------------------------------------------------

export const getGlobalLeaderboard = async (req: Request, res: Response) => {
    try {
        const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);
        const leaderboard = await QuizRepository.globalLeaderboard({ limit });
        res.json({ success: true, data: leaderboard, count: leaderboard.length });
    } catch (error) {
        logger.error('Global leaderboard error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getQuizLeaderboard = async (req: Request, res: Response) => {
    try {
        const limit = Math.min(parseInt(req.query.limit as string, 10) || 25, 100);

        // A player refreshing the room leaderboard is the most likely moment
        // for a closed round to get noticed — settle it in the background.
        const quiz = await QuizRepository.findQuizById(req.params.id);
        if (quiz && isSettlementDue(quiz)) settleInBackground(quiz.id);

        const leaderboard = await QuizRepository.quizLeaderboard(req.params.id, { limit });
        res.json({
            success: true,
            data: leaderboard,
            count: leaderboard.length,
            round: quiz
                ? {
                    phase: deriveRoundPhase(quiz),
                    prize_pool: Number(quiz.prize_pool || 0),
                    closes_at: quiz.closes_at,
                    settled_at: quiz.settled_at,
                    settlement: quiz.settlement || null
                }
                : null
        });
    } catch (error) {
        logger.error('Quiz leaderboard error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getMyAttempts = async (req: Request, res: Response) => {
    try {
        const attempts = await QuizRepository.findAttemptsByUser(req.user.id);
        res.json({ success: true, data: attempts, count: attempts.length });
    } catch (error) {
        logger.error('My attempts error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
