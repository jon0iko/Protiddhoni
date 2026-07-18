/**
 * Authentication Routes
 */

import express from 'express';
const router = express.Router();
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);

export default router;
