/**
 * Review Routes
 */

import express from 'express';
const router = express.Router();
import * as reviewController from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';

// Public routes
router.get('/content/:contentId', reviewController.getByContentId);
router.get('/user/:userId', reviewController.getByUserId);

// Protected routes
router.post('/', authenticate, reviewController.create);
router.put('/:id', authenticate, reviewController.update);
router.delete('/:id', authenticate, reviewController.delete);

export default router;
