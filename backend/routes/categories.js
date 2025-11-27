/**
 * Category Routes
 */

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Public routes
router.get('/', categoryController.getAll);
router.get('/:slug', categoryController.getBySlug);
router.get('/:slug/content', categoryController.getContent);

module.exports = router;
