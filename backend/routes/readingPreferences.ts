/**
 * Reading Preferences Routes
 */

import express from 'express';
const router = express.Router();
import * as readingPreferencesController from '../controllers/readingPreferencesController';
import { authenticate } from '../middleware/auth';

// All preferences routes require authentication
router.use(authenticate);

router.get('/', readingPreferencesController.getPreferences);
router.put('/', readingPreferencesController.updatePreferences);

export default router;
