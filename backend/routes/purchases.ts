/**
 * Content Purchase Routes
 * Routes for purchasing premium content and checking purchase status
 */

import express from 'express';
import { authenticate } from '../middleware/auth';
import ContentPurchaseController from '../controllers/contentPurchaseController';

const router = express.Router();

/**
 * POST /api/purchases/check/:contentId
 * Check if user has purchased specific content
 * Protected: Yes (requires authentication)
 */
router.get('/check/:contentId', authenticate, ContentPurchaseController.checkPurchase);

/**
 * POST /api/purchases/:contentId
 * Purchase premium content
 * Protected: Yes (requires authentication)
 * Body: { amount: number }
 */
router.post('/:contentId', authenticate, ContentPurchaseController.purchaseContent);

/**
 * GET /api/purchases
 * Get list of user's purchased content
 * Protected: Yes (requires authentication)
 */
router.get('/', authenticate, ContentPurchaseController.getUserPurchases);

export default router;
