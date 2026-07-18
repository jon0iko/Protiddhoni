import type { SupabaseClient } from '@supabase/supabase-js';
import type { Request, Response, NextFunction } from 'express';
import db from '../config/database';
import logger from '../config/logger';
import { SSLCommerzPayment, BkashPayment, SimPayment } from '../services/paymentStrategy';
import WalletService from '../services/walletService';
import PayoutService from '../services/payoutService';

class PaymentController {
  private supabase: SupabaseClient;
  private logger: typeof logger;

  constructor() {
    this.supabase = db.getClient();
    this.logger = logger;
    this.handleWebhook = this.handleWebhook.bind(this);
    this.tipWriter = this.tipWriter.bind(this);
    this.getWalletBalance = this.getWalletBalance.bind(this);
    this.createCheckout = this.createCheckout.bind(this);
  }

  /**
   * Simulated checkout — no external provider. Runs the SimPayment strategy
   * and, on success, credits the user's wallet through the existing
   * WalletService.topUpWallet path (same RPC the real webhook would use).
   *
   * POST /api/payments/checkout
   * Body: { amount: number, paymentMethod?: string, simOutcome?: 'success'|'failure' }
   */
  async createCheckout(req: Request, res: Response) {
    const userId = req.user.id;
    const { amount, paymentMethod, simOutcome, simFailureRate, simLatencyMs } = req.body || {};

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number.' });
    }
    if (numericAmount > 100000) {
      return res.status(400).json({ error: 'Amount exceeds simulator limit.' });
    }

    const strategy = new SimPayment();
    const result = await strategy.processPayment(numericAmount, {
      userId,
      paymentMethod: paymentMethod || 'sim',
      simOutcome,
      simFailureRate,
      simLatencyMs
    });

    try {
      await this.supabase.from('payment_webhooks_log').insert({
        provider: 'sim',
        transaction_id: result.transactionId,
        payload: { userId, amount: numericAmount, paymentMethod, simOutcome, result },
        status: result.success ? 'received' : 'failed',
        error_message: result.success ? null : result.error
      });
    } catch (logErr) {
      this.logger.warn(`Sim checkout log insert failed (non-fatal): ${logErr.message}`);
    }

    if (!result.success) {
      this.logger.info(`Sim checkout declined for user ${userId}: ${result.transactionId}`);
      return res.status(402).json({
        success: false,
        status: 'failed',
        transactionId: result.transactionId,
        error: result.error || 'Payment declined'
      });
    }

    try {
      const newBalance = await WalletService.topUpWallet(userId, numericAmount, result.transactionId);

      await this.supabase
        .from('payment_webhooks_log')
        .update({ status: 'processed', processed_at: new Date() })
        .eq('transaction_id', result.transactionId);

      this.logger.info(`Sim checkout processed: user ${userId} +${numericAmount} kori (txn ${result.transactionId})`);
      return res.status(200).json({
        success: true,
        status: 'completed',
        transactionId: result.transactionId,
        amount: numericAmount,
        balance: newBalance,
        method: result.method,
        processedAt: result.processedAt
      });
    } catch (error) {
      this.logger.error(`Sim checkout wallet top-up failed for user ${userId}:`, error);
      await this.supabase
        .from('payment_webhooks_log')
        .update({ status: 'failed', error_message: error.message })
        .eq('transaction_id', result.transactionId);
      return res.status(500).json({
        success: false,
        status: 'failed',
        transactionId: result.transactionId,
        error: 'Failed to credit wallet after simulated payment.'
      });
    }
  }

  /**
   * Universal Webhook handler with Idempotency Key (reference ID checks).
   */
  async handleWebhook(req: Request, res: Response) {
    const provider = req.params.provider; // 'sslcommerz' or 'bkash'
    const payload = req.body;
    const headers = req.headers;

    let strategy;
    let secretKey;
    let transactionId;
    let amount;
    let userId; // E.g., parsed from the metadata sent with the gateway

    // Determine Strategy and Setup Variables
    if (provider === 'sslcommerz') {
      strategy = new SSLCommerzPayment();
      secretKey = process.env.SSLCOMMERZ_STORE_PASSWORD || 'MOCK_STORE_PASS';
      transactionId = payload.tran_id; // SSLCommerz usually returns tran_id
      amount = parseFloat(payload.amount);
      userId = payload.value_a; // Assuming user_id was sent in value_a metadata parameter
    } else if (provider === 'bkash') {
      strategy = new BkashPayment();
      secretKey = process.env.BKASH_APP_SECRET || 'MOCK_APP_SECRET';
      transactionId = payload.trxID; // bKash uses trxID
      amount = parseFloat(payload.amount);
      userId = payload.intent || payload.merchantInvoiceNumber.split('_')[1]; // Mock logic
    } else {
      this.logger.warn(`Unknown payment provider webhook attempt: ${provider}`);
      return res.status(400).json({ error: 'Unknown payment provider' });
    }

    if (!transactionId || !amount || !userId) {
      this.logger.error(`Webhook payload missing crucial data from ${provider}`);
      return res.status(400).json({ error: 'Invalid payload structure' });
    }

    // Step 1: Verify Cryptographic Webhook Security Signature
    const isValid = strategy.verifyWebhook(payload, headers, secretKey);
    if (!isValid) {
      this.logger.error(`Signature Verification Failed for ${provider}`);
      return res.status(401).json({ error: 'Webhook signature verification failed' });
    }

    // Step 2: Idempotency Check using Webhooks Log DB
    try {
      // First try to log this webhook request. If the transactionId already exists, it will throw a unique constraint error.
      const { data: logEntry, error: logError } = await this.supabase
        .from('payment_webhooks_log')
        .insert({
          provider,
          transaction_id: transactionId,
          payload,
          status: 'received'
        })
        .select()
        .single();

      if (logError) {
        // Unique violation means we already processed this webhook!
        if (logError.code === '23505') { 
          this.logger.info(`Duplicate webhook received for transaction ${transactionId}. Idempotency intact.`);
          return res.status(200).json({ message: 'Webhook already processed' });
        }
        throw logError;
      }

      // Step 3: Top-up wallet and finalize processing log
      if (payload.status === 'VALID' || payload.transactionStatus === 'Completed') {
        const newBalance = await WalletService.topUpWallet(userId, amount, transactionId);
        
        // Mark Webhook Log as processed
        await this.supabase
            .from('payment_webhooks_log')
            .update({ status: 'processed', processed_at: new Date() })
            .eq('transaction_id', transactionId);

        this.logger.info(`Idempotent Webhook Processed: User ${userId} wallet topped up by ${amount}. New balance: ${newBalance}`);
        return res.status(200).json({ message: 'Payment successfully processed' });
      } else {
        // Update log as failed based on payload status
        await this.supabase
            .from('payment_webhooks_log')
            .update({ status: 'failed', error_message: 'Payment was not successful upstream' })
            .eq('transaction_id', transactionId);
            
        this.logger.warn(`Webhook logged but payment upstream failed: ${transactionId}`);
        return res.status(200).json({ message: 'Payment recorded as failed based on payload' });
      }

    } catch (error) {
      this.logger.error(`Idempotency/Webhook processing pipeline error:`, error);
      // Attempt to log failure
      await this.supabase
        .from('payment_webhooks_log')
        .update({ status: 'failed', error_message: error.message })
        .eq('transaction_id', transactionId);

      return res.status(500).json({ error: 'Internal server error processing webhook' });
    }
  }

  /**
   * Distributes Kori from one user (Reader) to another user (Writer) via Atomic Transfers.
   */
  async tipWriter(req: Request, res: Response) {
    const { amount, metadata } = req.body;
    const authorId = req.params.authorId; 
    const senderId = req.user.id; // From Auth Middleware

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Tip amount must be greater than zero.' });
    }

    if (authorId === senderId) {
      return res.status(400).json({ error: 'You cannot tip yourself.' });
    }

    try {
      // Execute the atomic distributed transaction via the Database RPC lock
      const transactionId = await WalletService.transferKori(
        senderId, 
        authorId, 
        amount, 
        'tip', 
        { ...metadata, origin: 'api_tipping' }
      );

      this.logger.info(`User ${senderId} successfully tipped user ${authorId} ${amount} Kori. Trx: ${transactionId}`);
      return res.status(200).json({ 
        message: 'Tip successful!',
        transactionId: transactionId,
        amount
      });
    } catch (error) {
      this.logger.error(`Error tipping author ${authorId}:`, error);
      
      // Filter out technical DB errors into friendly strings if needed
      if (error.message.includes('Insufficient funds')) {
        return res.status(402).json({ error: 'Insufficient funds. Please purchase more Kori.' });
      }

      return res.status(500).json({ error: 'Could not process tip transaction. Please try again later.' });
    }
  }

  /**
   * Fetches current users wallet balance
   */
  async getWalletBalance(req: Request, res: Response) {
    const userId = req.user.id;
    try {
      const wallet = await WalletService.getWalletByUserId(userId);
      if (!wallet) {
          return res.status(404).json({ error: 'Wallet not found' });
      }
      return res.json({ balance: wallet.balance, id: wallet.id, status: wallet.status });
    } catch (error) {
      this.logger.error(`Error fetching wallet for ${userId}:`, error);
      return res.status(500).json({ error: 'Failed to fetch wallet info.' });
    }
  }

  /**
   * Fetches transaction history for the current user
   * GET /api/payments/transactions?limit=20&offset=0
   */
  async getTransactionHistory(req: Request, res: Response) {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100); // Max 100 per request
    const offset = parseInt(req.query.offset as string) || 0;

    try {
      const userWallet = await WalletService.getWalletByUserId(userId);
      if (!userWallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      const walletId = userWallet.id;

      // Get transactions where user is either sender or receiver
      const { data: transactions, error: txnError } = await this.supabase
        .from('kori_transactions')
        .select(`
          id,
          from_wallet_id,
          to_wallet_id,
          amount,
          transaction_type,
          status,
          metadata,
          created_at,
          completed_at
        `)
        .or(`from_wallet_id.eq.${walletId},to_wallet_id.eq.${walletId}`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (txnError) {
        this.logger.error(`Error fetching transactions for wallet ${walletId}:`, txnError);
        return res.status(500).json({ error: 'Failed to fetch transaction history' });
      }

      // Get total count for pagination
      const { count, error: countError } = await this.supabase
        .from('kori_transactions')
        .select('id', { count: 'exact', head: true })
        .or(`from_wallet_id.eq.${walletId},to_wallet_id.eq.${walletId}`);

      if (countError) {
        this.logger.warn(`Could not get transaction count:`, countError);
      }

      // Enrich transactions with user info for display
      const enriched = (transactions || []).map((txn) => {
        const isIncoming = txn.to_wallet_id === walletId;
        return {
          ...txn,
          isIncoming,
          displayAmount: isIncoming ? `+${txn.amount}` : `-${txn.amount}`,
          displayType: this.formatTransactionType(txn.transaction_type)
        };
      });

      return res.json({
        success: true,
        data: enriched,
        pagination: {
          limit,
          offset,
          total: count || 0
        }
      });
    } catch (error) {
      this.logger.error(`Error fetching transaction history for ${userId}:`, error);
      return res.status(500).json({ error: 'Failed to fetch transaction history' });
    }
  }

  /**
   * Get payoutable amount for current user
   * GET /api/payments/payoutable
   */
  async getPayoutableAmount(req: Request, res: Response) {
    const userId = req.user.id;
    try {
      const result = await PayoutService.getPayoutableAmount(userId);
      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      this.logger.error(`Error fetching payoutable for ${userId}:`, error);
      return res.status(500).json({ error: 'Failed to fetch payoutable amount' });
    }
  }

  /**
   * Simulate payout without actually processing it
   * GET /api/payments/payout-simulation
   */
  async simulatePayout(req: Request, res: Response) {
    const userId = req.user.id;
    try {
      const result = await PayoutService.simulatePayout(userId);
      return res.json(result);
    } catch (error) {
      this.logger.error(`Error simulating payout for ${userId}:`, error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to simulate payout' 
      });
    }
  }

  /**
   * Process actual payout for current user
   * POST /api/payments/payout
   * Body: { amount?: number }
   */
  async processPayout(req: Request, res: Response) {
    const userId = req.user.id;
    const { amount } = req.body;

    try {
      const result = await PayoutService.processPayout(userId, amount);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      this.logger.error(`Error processing payout for ${userId}:`, error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to process payout' 
      });
    }
  }

  /**
   * Format transaction type for display
   */
  formatTransactionType(type) {
    const typeMap = {
      'purchase': 'প্রিমিয়াম কনটেন্ট ক্রয়',
      'tip': 'টিপ প্রদান',
      'content_purchase': 'সামগ্রী বিক্রয়',
      'quiz_reward': 'কুইজ পুরস্কার',
      'withdrawal': 'উত্তোলন',
      'system_mint': 'বোনাস ক্রেডিট',
      'refund': 'রিফান্ড'
    };
    return typeMap[type] || type;
  }
}

export default new PaymentController();