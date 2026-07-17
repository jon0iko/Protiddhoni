/**
 * Content Routes
 */

const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const authorStatsController = require('../controllers/authorStatsController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');

// Public routes
router.get('/search', contentController.advancedSearch);
router.get('/published', contentController.getPublished);
router.get('/category/:categorySlug', contentController.getByCategory);
router.get('/author/:authorId', contentController.getByAuthor);
router.get('/slug/:slug', optionalAuth, contentController.getBySlug);
router.get('/:id', contentController.getById);

// Author stats routes (authenticated)
router.get('/stats/author/:authorId', authenticate, authorStatsController.getAuthorStats);
router.get('/recent-activity/:authorId', authenticate, authorStatsController.getRecentActivity);

// User routes (authenticated)
router.get('/my/drafts', authenticate, contentController.getMyDrafts);
router.post('/', authenticate, contentController.create);
router.put('/:id', authenticate, contentController.update);
router.delete('/:id', authenticate, contentController.delete);
router.post('/:id/submit', authenticate, contentController.submitForReview);

// Admin-only routes
router.get('/admin/pending', authenticate, requireAdmin, contentController.getPending);
router.get('/admin/action-history', authenticate, requireAdmin, contentController.getAdminActionHistory);
router.post('/:id/approve', authenticate, requireAdmin, contentController.approve);
router.post('/:id/reject', authenticate, requireAdmin, contentController.reject);
router.post('/:id/unpublish', authenticate, requireAdmin, contentController.unpublish);
router.post('/:id/republish', authenticate, requireAdmin, contentController.republish);
router.post('/stats/refresh', authenticate, requireAdmin, authorStatsController.refreshAuthorStats);

module.exports = router;
