/**
 * Like Routes
 */

const express = require('express');
const router = express.Router();
const likeController = require('../controllers/likeController');
const { authenticate } = require('../middleware/auth');

// All like routes require authentication
router.use(authenticate);

router.get('/', likeController.getMyLikes);
router.post('/', likeController.addLike);
router.delete('/:contentId', likeController.removeLike);
router.get('/check/:contentId', likeController.checkLike);
router.get('/count/:contentId', likeController.getLikeCount);

module.exports = router;
