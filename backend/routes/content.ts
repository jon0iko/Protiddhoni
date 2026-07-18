/**
 * Content Routes
 */

import express from 'express';
const router = express.Router();
import * as contentController from '../controllers/contentController';
import * as authorStatsController from '../controllers/authorStatsController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

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
router.post('/:id/approve', authenticate, requireAdmin, contentController.approve);
router.post('/:id/reject', authenticate, requireAdmin, contentController.reject);
router.post('/stats/refresh', authenticate, requireAdmin, authorStatsController.refreshAuthorStats);

export default router;
