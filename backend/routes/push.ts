import express from 'express';
const router = express.Router();
import * as pushController from '../controllers/pushController';
import { authenticate } from '../middleware/auth';

// Public — frontend needs this before subscription
router.get('/vapid-public-key', pushController.getVapidPublicKey);

// Protected — requires logged-in user
router.post('/subscribe', authenticate, pushController.subscribe);
router.post('/unsubscribe', authenticate, pushController.unsubscribe);

export default router;
