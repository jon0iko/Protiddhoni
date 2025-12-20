/**
 * Reading Preferences Routes
 */

const express = require('express');
const router = express.Router();
const readingPreferencesController = require('../controllers/readingPreferencesController');
const { authenticate } = require('../middleware/auth');

// All preferences routes require authentication
router.use(authenticate);

router.get('/', readingPreferencesController.getPreferences);
router.put('/', readingPreferencesController.updatePreferences);

module.exports = router;
