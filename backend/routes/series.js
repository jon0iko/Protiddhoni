/**
 * Series Routes
 */

const express = require('express');
const router = express.Router();
const seriesController = require('../controllers/seriesController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/published', seriesController.getPublished);
router.get('/author/:authorId', seriesController.getByAuthor);
router.get('/slug/:slug', seriesController.getBySlug);
router.get('/:id', seriesController.getById);
router.get('/:seriesId/chapters', seriesController.getChapters);

// User routes (authenticated)
router.post('/', authenticate, seriesController.create);
router.put('/:id', authenticate, seriesController.update);
router.delete('/:id', authenticate, seriesController.delete);

module.exports = router;
