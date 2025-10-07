/**
 * Review Routes
 */

const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/content/:contentId', reviewController.getByContentId);

// Protected routes
router.post('/', authenticate, reviewController.create);
router.put('/:id', authenticate, reviewController.update);
router.delete('/:id', authenticate, reviewController.delete);

module.exports = router;
