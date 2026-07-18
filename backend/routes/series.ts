/**
 * Series Routes
 */

import express from 'express';
const router = express.Router();
import * as seriesController from '../controllers/seriesController';
import { authenticate } from '../middleware/auth';

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

export default router;
