/**
 * Quiz Routes
 *  - /api/quizzes               (public + auth required for play)
 *  - /api/quizzes/admin/...     (admin-only management endpoints)
 */

const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');

// ---- Public / player endpoints --------------------------------------------

// List published quizzes; optional auth so we can annotate user attempt status
router.get('/', optionalAuth, quizController.listPublishedQuizzes);

// Global leaderboard (public)
router.get('/leaderboard', quizController.getGlobalLeaderboard);

// User's own attempt history
router.get('/me/attempts', authenticate, quizController.getMyAttempts);

// Quiz-specific leaderboard
router.get('/:id/leaderboard', quizController.getQuizLeaderboard);

// Preview a single quiz (no questions exposed)
router.get('/:id', optionalAuth, quizController.getQuizPreview);

// Spend Kori to start an attempt — returns questions w/o correct indices
router.post('/:id/start', authenticate, quizController.startAttempt);

// Submit answers, score, and award Kori
router.post('/attempts/:attemptId/submit', authenticate, quizController.submitAttempt);

// Retrieve a previously submitted attempt for review
router.get('/attempts/:attemptId', authenticate, quizController.getAttempt);

// ---- Admin endpoints -------------------------------------------------------

router.get('/admin/all', authenticate, requireAdmin, quizController.listAllQuizzes);
router.post('/admin', authenticate, requireAdmin, quizController.createQuiz);
router.post('/admin/from-content/:contentId', authenticate, requireAdmin, quizController.createQuizFromContent);
router.patch('/admin/questions/:id', authenticate, requireAdmin, quizController.updateQuestion);
router.get('/admin/:id', authenticate, requireAdmin, quizController.getQuizForAdmin);
router.patch('/admin/:id', authenticate, requireAdmin, quizController.updateQuizSettings);
router.post('/admin/:id/regenerate', authenticate, requireAdmin, quizController.regenerateQuestions);
router.delete('/admin/:id', authenticate, requireAdmin, quizController.deleteQuiz);

module.exports = router;
