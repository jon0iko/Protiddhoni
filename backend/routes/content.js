/**
 * Content Routes
 */

const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');

// Public routes
router.get('/published', contentController.getPublished);
router.get('/slug/:slug', contentController.getBySlug);
router.get('/:id', contentController.getById);

// User routes (authenticated)
router.post('/', authenticate, contentController.create);
router.put('/:id', authenticate, contentController.update);
router.delete('/:id', authenticate, contentController.delete);
router.post('/:id/submit', authenticate, contentController.submitForReview);

// Admin-only routes
router.get('/admin/pending', authenticate, requireAdmin, contentController.getPending);
router.post('/:id/approve', authenticate, requireAdmin, contentController.approve);
router.post('/:id/reject', authenticate, requireAdmin, contentController.reject);

module.exports = router;
