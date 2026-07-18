/**
 * Comment Routes
 */

import express from 'express';
const router = express.Router();
import * as commentController from '../controllers/commentController';
import { authenticate } from '../middleware/auth';

// Public routes
router.get('/content/:contentId', commentController.getByContentId);
router.get('/user/:userId', commentController.getByUserId);
router.get('/replies/:commentId', commentController.getReplies);

// Protected routes (require authentication)
router.post('/', authenticate, commentController.create);
router.put('/:id', authenticate, commentController.update);
router.delete('/:id', authenticate, commentController.delete);

export default router;
