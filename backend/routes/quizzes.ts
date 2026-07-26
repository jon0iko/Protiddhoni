/**
 * Quiz Routes
 *  - /api/quizzes               (public + auth required for play)
 *  - /api/quizzes/admin/...     (admin-only management endpoints)
 *
 * NOTE: literal paths MUST stay declared before the /:id patterns, otherwise
 * Express matches 'leaderboard' / 'admin' / 'attempts' as an :id.
 */

import express from 'express';
const router = express.Router();
import * as quizController from '../controllers/quizController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

// ---- Public / player endpoints --------------------------------------------

// List published rounds; optional auth so we can annotate user entry status
router.get('/', optionalAuth, quizController.listPublishedQuizzes);

// Global leaderboard (public)
router.get('/leaderboard', quizController.getGlobalLeaderboard);

// User's own attempt history
router.get('/me/attempts', authenticate, quizController.getMyAttempts);

// Room leaderboard for a single round
router.get('/:id/leaderboard', quizController.getQuizLeaderboard);

// Preview a single round (no questions exposed)
router.get('/:id', optionalAuth, quizController.getQuizPreview);

// Confirm entry — charges Kori into the prize pool. Idempotent.
router.post('/:id/enter', authenticate, quizController.enterRound);

// Begin playing an already-entered round — charges nothing
router.post('/:id/start', authenticate, quizController.startAttempt);

// Submit answers and lock in a score (payout happens at settlement)
router.post('/attempts/:attemptId/submit', authenticate, quizController.submitAttempt);

// Retrieve a previously submitted attempt for review
router.get('/attempts/:attemptId', authenticate, quizController.getAttempt);

// ---- Admin endpoints -------------------------------------------------------

router.get('/admin/all', authenticate, requireAdmin, quizController.listAllQuizzes);
router.post('/admin', authenticate, requireAdmin, quizController.createQuiz);
router.patch('/admin/questions/:id', authenticate, requireAdmin, quizController.updateQuestion);
router.delete('/admin/questions/:id', authenticate, requireAdmin, quizController.deleteQuestion);
router.get('/admin/:id', authenticate, requireAdmin, quizController.getQuizForAdmin);
router.patch('/admin/:id', authenticate, requireAdmin, quizController.updateQuizSettings);
router.post('/admin/:id/questions', authenticate, requireAdmin, quizController.createQuestion);
router.post('/admin/:id/regenerate', authenticate, requireAdmin, quizController.regenerateQuestions);
router.post('/admin/:id/settle', authenticate, requireAdmin, quizController.settleRoundAdmin);
router.delete('/admin/:id', authenticate, requireAdmin, quizController.deleteQuiz);

export default router;
