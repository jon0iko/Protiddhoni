/**
 * Comment Routes
 */

const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/content/:contentId', commentController.getByContentId);
router.get('/user/:userId', commentController.getByUserId);
router.get('/replies/:commentId', commentController.getReplies);

// Protected routes (require authentication)
router.post('/', authenticate, commentController.create);
router.put('/:id', authenticate, commentController.update);
router.delete('/:id', authenticate, commentController.delete);

module.exports = router;
