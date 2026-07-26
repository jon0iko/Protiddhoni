/**
 * Report Routes
 */

import express from 'express';
const router = express.Router();
import * as reportController from '../controllers/reportController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

// User reporting endpoint (requires authentication)
router.post('/', authenticate, reportController.createReport);

// Admin moderation endpoints (require admin authentication)
router.get('/admin/pending', authenticate, requireAdmin, reportController.getPendingReports);
router.post('/admin/resolve', authenticate, requireAdmin, reportController.resolveReports);

export default router;
