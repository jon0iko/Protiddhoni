/**
 * Category Routes
 */

import express from 'express';
const router = express.Router();
import * as categoryController from '../controllers/categoryController';
import { authenticate } from '../middleware/auth';

// Public routes
router.get('/', categoryController.getAll);
router.get('/:slug', categoryController.getBySlug);
router.get('/:slug/content', categoryController.getContent);

// Protected routes
router.post('/', authenticate, categoryController.create);
router.delete('/:id', authenticate, categoryController.delete);

export default router;
