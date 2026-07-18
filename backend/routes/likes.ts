/**
 * Like Routes
 */

import express from 'express';
const router = express.Router();
import * as likeController from '../controllers/likeController';
import { authenticate } from '../middleware/auth';

// All like routes require authentication
router.use(authenticate);

router.get('/', likeController.getMyLikes);
router.post('/', likeController.addLike);
router.delete('/:contentId', likeController.removeLike);
router.get('/check/:contentId', likeController.checkLike);
router.get('/count/:contentId', likeController.getLikeCount);

export default router;
