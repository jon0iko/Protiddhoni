/**
 * Bookmark Routes
 */

import express from 'express';
const router = express.Router();
import * as bookmarkController from '../controllers/bookmarkController';
import { authenticate } from '../middleware/auth';

// All bookmark routes require authentication
router.use(authenticate);

router.get('/', bookmarkController.getMyBookmarks);
router.post('/', bookmarkController.addBookmark);
router.delete('/:contentId', bookmarkController.removeBookmark);
router.get('/check/:contentId', bookmarkController.checkBookmark);

export default router;
