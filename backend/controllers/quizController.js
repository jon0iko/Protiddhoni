/**
 * Quiz Controller
 * Admins curate source material -> Gemini generates MCQs ->
 * users pay Kori to participate -> scores feed into the global leaderboard.
 */

const QuizRepository = require('../repositories/QuizRepository');
const ContentRepository = require('../repositories/ContentRepository');
const geminiService = require('../services/geminiService');
const WalletService = require('../services/walletService');
const logger = require('../config/logger');
const {
    randomSeed,
    seededShuffle,
    seededIndexPermutation,
    deriveSeed
} = require('../utils/shuffle');

// Grace period (seconds) added to the time limit before we reject a submission
// — covers network latency between client clock and server clock.
const SUBMIT_GRACE_SECONDS = 5;

const DEFAULT_QUESTION_COUNT = 5;

// ---- Admin endpoints -------------------------------------------------------

exports.listAllQuizzes = async (req, res) => {
    try {
        const quizzes = await QuizRepository.findAllQuizzes();
        res.json({ success: true, data: quizzes, count: quizzes.length });
    } catch (error) {
        logger.error('List quizzes error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Internal helper: shared "generate + persist" path used by both
 * createQuiz (manual source text) and createQuizFromContent (existing story).
 */
async function generateAndPersistQuiz({
    userId,
    title,
    description,
    sourceMaterial,
    difficulty,
    entryCost,
    rewardPerCorrect,
    questionCount,
    language,
    sourceContentId = null
}) {
    const aiResult = await geminiService.generateQuizQuestions({
        title,
        sourceMaterial,
        questionCount,
        difficulty,
        language
    });

    const quiz = await QuizRepository.createQuiz({
        created_by: userId,
        title: title.trim(),
        description: description?.trim() || null,
        source_material: sourceMaterial,
        source_content_id: sourceContentId,
        difficulty,
        entry_cost: entryCost,
        reward_per_correct: rewardPerCorrect,
        total_questions: aiResult.questions.length,
        status: 'draft',
        ai_model: aiResult.model
    });

    const questions = await QuizRepository.replaceQuestions(quiz.id, aiResult.questions);

    return {
        quiz,
        questions: questions.map((q) => ({
            id: q.id,
            position: q.position,
            question_text: q.question_text,
            options: q.options,
            correct_index: q.correct_index,
            explanation: q.explanation
        }))
    };
}

/**
 * Strip basic HTML and collapse whitespace so the AI gets clean text.
 * Content body is stored as Tiptap HTML.
 */
function htmlToPlainText(html) {
    if (!html || typeof html !== 'string') return '';
    return html
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

exports.createQuiz = async (req, res) => {
    try {
        const {
            title,
            description,
            source_material,
            difficulty = 'medium',
            entry_cost = 5,
            reward_per_correct = 2,
            question_count = DEFAULT_QUESTION_COUNT,
            language = 'bn'
        } = req.body;

        if (!title || !source_material) {
            return res.status(400).json({
                success: false,
                error: 'Title and source material are required'
            });
        }
        if (source_material.length < 80) {
            return res.status(400).json({
                success: false,
                error: 'Source material is too short; provide at least 80 characters of context'
            });
        }
        if (!['easy', 'medium', 'hard'].includes(difficulty)) {
            return res.status(400).json({ success: false, error: 'Invalid difficulty' });
        }
        if (!geminiService.isConfigured()) {
            return res.status(503).json({
                success: false,
                error: 'AI question generation is not configured. Set GEMINI_API_KEY on the backend.'
            });
        }

        const data = await generateAndPersistQuiz({
            userId: req.user.id,
            title,
            description,
            sourceMaterial: source_material,
            difficulty,
            entryCost: Math.max(0, Number(entry_cost) || 0),
            rewardPerCorrect: Math.max(0, Number(reward_per_correct) || 0),
            questionCount: question_count,
            language
        });

        res.status(201).json({ success: true, data });
    } catch (error) {
        logger.error('Create quiz error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * POST /api/quizzes/admin/from-content/:contentId
 * Build a quiz directly from an existing story/chapter/poem.
 */
exports.createQuizFromContent = async (req, res) => {
    try {
        const contentId = req.params.contentId;
        const {
            title,
            description,
            difficulty = 'medium',
            entry_cost = 5,
            reward_per_correct = 2,
            question_count = DEFAULT_QUESTION_COUNT,
            language = 'bn'
        } = req.body || {};

        if (!geminiService.isConfigured()) {
            return res.status(503).json({
                success: false,
                error: 'AI question generation is not configured. Set GEMINI_API_KEY on the backend.'
            });
        }
        if (!['easy', 'medium', 'hard'].includes(difficulty)) {
            return res.status(400).json({ success: false, error: 'Invalid difficulty' });
        }

        let content;
        try {
            content = await ContentRepository.findById(contentId);
        } catch (err) {
            content = null;
        }
        if (!content) {
            return res.status(404).json({ success: false, error: 'Content not found' });
        }

        const plainBody = htmlToPlainText(content.body || '');
        if (plainBody.length < 80) {
            return res.status(400).json({
                success: false,
                error: 'Selected content has too little text to generate a quiz (need ≥80 chars).'
            });
        }

        const resolvedTitle = (title && title.trim()) || `${content.title} — কুইজ`;

        const data = await generateAndPersistQuiz({
            userId: req.user.id,
            title: resolvedTitle,
            description: description ?? `"${content.title}" থেকে স্বয়ংক্রিয়ভাবে তৈরি কুইজ।`,
            sourceMaterial: plainBody,
            difficulty,
            entryCost: Math.max(0, Number(entry_cost) || 0),
            rewardPerCorrect: Math.max(0, Number(reward_per_correct) || 0),
            questionCount: question_count,
            language,
            sourceContentId: content.id
        });

        res.status(201).json({
            success: true,
            data: {
                ...data,
                source_content: {
                    id: content.id,
                    title: content.title,
                    slug: content.slug
                }
            }
        });
    } catch (error) {
        logger.error('Create quiz from content error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.regenerateQuestions = async (req, res) => {
    try {
        const quiz = await QuizRepository.findQuizById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ success: false, error: 'Quiz not found' });
        }
        if (quiz.status === 'published') {
            return res.status(400).json({
                success: false,
                error: 'Archive or unpublish this quiz before regenerating questions'
            });
        }
        if (!geminiService.isConfigured()) {
            return res.status(503).json({
                success: false,
                error: 'AI question generation is not configured'
            });
        }

        const questionCount = Math.max(1, Number(req.body?.question_count) || quiz.total_questions || DEFAULT_QUESTION_COUNT);
        const aiResult = await geminiService.generateQuizQuestions({
            title: quiz.title,
            sourceMaterial: quiz.source_material,
            questionCount,
            difficulty: quiz.difficulty,
            language: req.body?.language || 'bn'
        });

        const questions = await QuizRepository.replaceQuestions(quiz.id, aiResult.questions);
        const updated = await QuizRepository.updateQuiz(quiz.id, {
            total_questions: questions.length,
            ai_model: aiResult.model
        });

        res.json({
            success: true,
            data: {
                quiz: updated,
                questions: questions.map((q) => ({
                    id: q.id,
                    position: q.position,
                    question_text: q.question_text,
                    options: q.options,
                    correct_index: q.correct_index,
                    explanation: q.explanation
                }))
            }
        });
    } catch (error) {
        logger.error('Regenerate questions error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateQuizSettings = async (req, res) => {
    try {
        const quiz = await QuizRepository.findQuizById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ success: false, error: 'Quiz not found' });
        }

        const allowed = ['title', 'description', 'entry_cost', 'reward_per_correct', 'difficulty', 'status', 'time_limit_seconds'];
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }

        if (updates.entry_cost !== undefined) updates.entry_cost = Math.max(0, Number(updates.entry_cost) || 0);
        if (updates.reward_per_correct !== undefined) updates.reward_per_correct = Math.max(0, Number(updates.reward_per_correct) || 0);
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
                        error: 'Cannot publish a quiz with no questions'
                    });
                }
                updates.published_at = new Date().toISOString();
            }
        }

        const updated = await QuizRepository.updateQuiz(quiz.id, updates);
        res.json({ success: true, data: updated });
    } catch (error) {
        logger.error('Update quiz error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteQuiz = async (req, res) => {
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

exports.getQuizForAdmin = async (req, res) => {
    try {
        const quiz = await QuizRepository.findQuizById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ success: false, error: 'Quiz not found' });
        }
        const questions = await QuizRepository.findQuestionsByQuizId(quiz.id, { includeAnswers: true });
        res.json({ success: true, data: { quiz, questions } });
    } catch (error) {
        logger.error('Get quiz error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * PATCH /api/quizzes/admin/questions/:id
 * Inline edit a single question without disturbing the rest of the quiz.
 */
exports.updateQuestion = async (req, res) => {
    try {
        const existing = await QuizRepository.findQuestionById(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, error: 'Question not found' });
        }

        const { question_text, options, correct_index, explanation } = req.body || {};
        const updates = {};

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

// ---- Public / player endpoints --------------------------------------------

exports.listPublishedQuizzes = async (req, res) => {
    try {
        const quizzes = await QuizRepository.findPublishedQuizzes();

        // Annotate user's attempt status if logged-in
        if (req.user) {
            const userId = req.user.id;
            const annotated = await Promise.all(quizzes.map(async (quiz) => {
                const attempt = await QuizRepository.findAttempt(quiz.id, userId);
                return {
                    ...quiz,
                    user_attempt: attempt
                        ? {
                            id: attempt.id,
                            status: attempt.status,
                            score: attempt.score,
                            correct_answers: attempt.correct_answers,
                            kori_earned: Number(attempt.kori_earned)
                        }
                        : null
                };
            }));
            return res.json({ success: true, data: annotated, count: annotated.length });
        }

        res.json({ success: true, data: quizzes, count: quizzes.length });
    } catch (error) {
        logger.error('List published quizzes error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getQuizPreview = async (req, res) => {
    try {
        const quiz = await QuizRepository.findQuizById(req.params.id);
        if (!quiz || quiz.status !== 'published') {
            return res.status(404).json({ success: false, error: 'Quiz not found' });
        }

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

        res.json({
            success: true,
            data: {
                quiz: {
                    id: quiz.id,
                    title: quiz.title,
                    description: quiz.description,
                    difficulty: quiz.difficulty,
                    entry_cost: Number(quiz.entry_cost),
                    reward_per_correct: Number(quiz.reward_per_correct),
                    total_questions: quiz.total_questions,
                    time_limit_seconds: quiz.time_limit_seconds || null,
                    creator: quiz.creator,
                    source_content: quiz.source_content || null,
                    published_at: quiz.published_at
                },
                user_attempt: userAttempt
            }
        });
    } catch (error) {
        logger.error('Get quiz preview error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.startAttempt = async (req, res) => {
    try {
        const quiz = await QuizRepository.findQuizById(req.params.id);
        if (!quiz || quiz.status !== 'published') {
            return res.status(404).json({ success: false, error: 'Quiz not found' });
        }

        const userId = req.user.id;
        let attemptInfo;
        try {
            attemptInfo = await QuizRepository.startAttempt(quiz.id, userId);
        } catch (rpcError) {
            const message = rpcError.message || 'Could not start quiz';
            if (message.includes('Insufficient')) {
                return res.status(402).json({ success: false, error: 'Insufficient Kori balance' });
            }
            if (message.includes('already attempted')) {
                return res.status(409).json({ success: false, error: 'You have already attempted this quiz' });
            }
            if (message.includes('not available')) {
                return res.status(400).json({ success: false, error: 'Quiz is not available' });
            }
            throw rpcError;
        }

        // Generate + persist per-attempt shuffle seed so questions / options
        // appear in a different order to every player while staying consistent
        // for this player across reloads.
        const seed = randomSeed();
        try {
            await QuizRepository.updateAttempt(attemptInfo.attemptId, { shuffle_seed: seed });
        } catch (err) {
            logger.warn('Failed to persist shuffle_seed (column missing?):', err.message);
        }

        const questions = await QuizRepository.findQuestionsByQuizId(quiz.id, { includeAnswers: true });
        const shuffledQuestions = seededShuffle(questions, seed).map((q) => {
            const perm = seededIndexPermutation(q.options.length, deriveSeed(seed, q.id));
            const shuffledOptions = perm.map((origIdx) => q.options[origIdx]);
            return {
                id: q.id,
                position: q.position,
                question_text: q.question_text,
                options: shuffledOptions
                // correct_index intentionally omitted
            };
        });

        res.status(201).json({
            success: true,
            data: {
                attempt_id: attemptInfo.attemptId,
                balance_after: attemptInfo.balanceAfter,
                started_at: new Date().toISOString(),
                quiz: {
                    id: quiz.id,
                    title: quiz.title,
                    difficulty: quiz.difficulty,
                    total_questions: quiz.total_questions,
                    reward_per_correct: Number(quiz.reward_per_correct),
                    time_limit_seconds: quiz.time_limit_seconds || null
                },
                questions: shuffledQuestions
            }
        });
    } catch (error) {
        logger.error('Start attempt error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.submitAttempt = async (req, res) => {
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

        // ---- Time-limit enforcement ----
        const timeLimit = Number(attempt.quiz?.time_limit_seconds);
        if (Number.isFinite(timeLimit) && timeLimit > 0) {
            const startedMs = new Date(attempt.started_at).getTime();
            const elapsedSeconds = (Date.now() - startedMs) / 1000;
            if (elapsedSeconds > timeLimit + SUBMIT_GRACE_SECONDS) {
                // Lock the attempt so the user can't keep retrying with stale answers
                await QuizRepository.updateAttempt(attempt.id, {
                    score: 0,
                    correct_answers: 0,
                    kori_earned: 0,
                    duration_ms: Math.round(elapsedSeconds * 1000),
                    status: 'completed',
                    completed_at: new Date().toISOString()
                });
                return res.status(408).json({
                    success: false,
                    error: 'সময় শেষ — উত্তর গৃহীত হয়নি',
                    data: {
                        expired: true,
                        time_limit_seconds: timeLimit,
                        elapsed_seconds: Math.round(elapsedSeconds)
                    }
                });
            }
        }

        const { answers, duration_ms } = req.body;
        if (!Array.isArray(answers) || !answers.length) {
            return res.status(400).json({ success: false, error: 'Answers array is required' });
        }

        const questions = await QuizRepository.findQuestionsByQuizId(attempt.quiz_id, { includeAnswers: true });
        const questionMap = new Map(questions.map((q) => [q.id, q]));

        // Recreate the per-attempt option permutation from the stored seed so we
        // can map the player's shuffled-space selection back to the original.
        const seed = attempt.shuffle_seed != null ? Number(attempt.shuffle_seed) : null;

        const answerRows = [];
        let correctCount = 0;
        for (const submitted of answers) {
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

        if (!answerRows.length) {
            return res.status(400).json({ success: false, error: 'No valid answers submitted' });
        }

        await QuizRepository.insertAnswers(answerRows);

        const rewardPerCorrect = Number(attempt.quiz?.reward_per_correct || 0);
        const totalReward = Math.round(correctCount * rewardPerCorrect * 100) / 100;

        let newBalance = null;
        if (totalReward > 0) {
            newBalance = await QuizRepository.awardReward(attempt.id, req.user.id, totalReward);
        } else {
            const wallet = await WalletService.getWalletByUserId(req.user.id);
            newBalance = wallet ? Number(wallet.balance) : null;
        }

        const completed = await QuizRepository.updateAttempt(attempt.id, {
            score: correctCount,
            correct_answers: correctCount,
            kori_earned: totalReward,
            duration_ms: Number.isFinite(Number(duration_ms)) ? Number(duration_ms) : null,
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
                kori_earned: totalReward,
                balance_after: newBalance,
                review
            }
        });
    } catch (error) {
        logger.error('Submit attempt error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getAttempt = async (req, res) => {
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

exports.getGlobalLeaderboard = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
        const leaderboard = await QuizRepository.globalLeaderboard({ limit });
        res.json({ success: true, data: leaderboard, count: leaderboard.length });
    } catch (error) {
        logger.error('Global leaderboard error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getQuizLeaderboard = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
        const leaderboard = await QuizRepository.quizLeaderboard(req.params.id, { limit });
        res.json({ success: true, data: leaderboard, count: leaderboard.length });
    } catch (error) {
        logger.error('Quiz leaderboard error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getMyAttempts = async (req, res) => {
    try {
        const attempts = await QuizRepository.findAttemptsByUser(req.user.id);
        res.json({ success: true, data: attempts, count: attempts.length });
    } catch (error) {
        logger.error('My attempts error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
