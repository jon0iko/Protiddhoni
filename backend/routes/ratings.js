const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { optionalAuth } = require('../middleware/auth');

// Submit or update rating (no auth required, but can be authenticated)
router.post('/', optionalAuth, ratingController.submitRating);

// Get rating statistics for a content (public)
router.get('/stats/:contentId', optionalAuth, ratingController.getRatingStats);

// Get user's rating for a content (no auth required)
router.get('/user/:contentId', optionalAuth, ratingController.getUserRating);

// Get all ratings for a content (public)
router.get('/content/:contentId', ratingController.getContentRatings);

// Get authenticated user's all ratings (requires auth)
router.get('/my-ratings', optionalAuth, ratingController.getUserRatings);

// Delete rating (requires auth)
router.delete('/:ratingId', optionalAuth, ratingController.deleteRating);

module.exports = router;
