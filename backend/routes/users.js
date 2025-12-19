/**
 * User Routes
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Public routes (with optional auth for isFollowing check)
router.get('/:username', optionalAuth, userController.getProfile);
router.get('/:userId/followers', userController.getFollowers);
router.get('/:userId/following', userController.getFollowing);
router.get('/:userId/content', userController.getContent);
router.get('/:userId/series', userController.getSeries);

// Protected routes
router.put('/:userId', authenticate, userController.updateProfile);
router.post('/:userId/follow', authenticate, userController.follow);
router.post('/:userId/unfollow', authenticate, userController.unfollow);

module.exports = router;
