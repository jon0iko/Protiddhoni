/**
 * User Routes
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/:username', userController.getProfile);
router.get('/:username/followers', userController.getFollowers);
router.get('/:username/following', userController.getFollowing);

// Protected routes
router.put('/profile', authenticate, userController.updateProfile);
router.post('/:username/follow', authenticate, userController.follow);
router.delete('/:username/follow', authenticate, userController.unfollow);

module.exports = router;
