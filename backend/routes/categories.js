/**
 * Category Routes
 */

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/', categoryController.getAll);
router.get('/:slug', categoryController.getBySlug);
router.get('/:slug/content', categoryController.getContent);

// Protected routes
router.post('/', authenticate, categoryController.create);
router.delete('/:id', authenticate, categoryController.delete);

module.exports = router;
