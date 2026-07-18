import type { Request, Response, NextFunction } from 'express';
import express from 'express';
const router = express.Router();
import PaymentController from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';

/**
 * @route POST /api/payments/webhook/:provider
 * @desc Receive webhooks from payment gateways (e.g. bKash, SSLCommerz)
 * @access Public (Security handled by cryptogrpahic signature validation and idempotency keys)
 */
router.post('/webhook/:provider', async (req, res) => {
    await PaymentController.handleWebhook(req, res);
});

/**
 * @route POST /api/payments/checkout
 * @desc Simulated checkout — credits the authenticated user's wallet without
 *       contacting any external provider. Useful for development and demos.
 * @access Private
 * @body { amount: number, paymentMethod?: string, simOutcome?: 'success'|'failure' }
 */
router.post('/checkout', authenticate, async (req, res) => {
    await PaymentController.createCheckout(req, res);
});

/**
 * @route GET /api/payments/wallet
 * @desc Get the current authenticated user's digital Kori wallet balance
 * @access Private
 */
router.get('/wallet', authenticate, async (req, res) => {
    await PaymentController.getWalletBalance(req, res);
});

/**
 * @route GET /api/payments/transactions
 * @desc Get transaction history for current user
 * @access Private
 * @query limit - Number of transactions to return (max 100, default 20)
 * @query offset - Pagination offset (default 0)
 */
router.get('/transactions', authenticate, async (req, res) => {
    await PaymentController.getTransactionHistory(req, res);
});

/**
 * @route POST /api/payments/tip/:authorId
 * @desc Atomically tip author Kori points from currently authenticated user
 * @access Private
 */
router.post('/tip/:authorId', authenticate, async (req, res) => {
    await PaymentController.tipWriter(req, res);
});

/**
 * @route GET /api/payments/payoutable
 * @desc Get payoutable amount breakdown for current user
 * @access Private
 */
router.get('/payoutable', authenticate, async (req, res) => {
    await PaymentController.getPayoutableAmount(req, res);
});

/**
 * @route GET /api/payments/payout-simulation
 * @desc Simulate payout without processing it
 * @access Private
 */
router.get('/payout-simulation', authenticate, async (req, res) => {
    await PaymentController.simulatePayout(req, res);
});

/**
 * @route POST /api/payments/payout
 * @desc Process actual payout (create withdrawal transaction)
 * @access Private
 * @body { amount?: number } - Optional specific amount, defaults to all payoutable
 */
router.post('/payout', authenticate, async (req, res) => {
    await PaymentController.processPayout(req, res);
});

export default router;