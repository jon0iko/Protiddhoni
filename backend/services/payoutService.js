/**
 * Payout Service
 * Handles calculation and processing of payoutable Kori for writers
 * Payoutable = Earned (Tips + Content Sales + Bonuses) - Given Out
 */

const db = require('../config/database');

class PayoutService {
  /**
   * Calculate total earned Kori (incoming transactions from earning)
   * @param {string} walletId - Wallet UUID
   * @returns {Promise<number>}
   */
  static async getEarnedKori(walletId) {
    try {
      const client = db.getClient();
      
      const { data, error } = await client
        .from('kori_transactions')
        .select('amount', { count: 'exact' })
        .eq('to_wallet_id', walletId)
        .in('transaction_type', ['tip', 'content_purchase', 'quiz_reward', 'system_mint'])
        .eq('status', 'completed');

      if (error) {
        console.error('Error fetching earned Kori:', error);
        return 0;
      }

      const total = (data || []).reduce((sum, txn) => sum + parseFloat(txn.amount || 0), 0);
      return total;
    } catch (err) {
      console.error('PayoutService.getEarnedKori error:', err);
      return 0;
    }
  }

  /**
   * Calculate total spent/given out Kori (outgoing transactions from earnings)
   * Tips given to others reduce payoutable balance
   * @param {string} walletId - Wallet UUID
   * @returns {Promise<number>}
   */
  static async getSpentKori(walletId) {
    try {
      const client = db.getClient();
      
      const { data, error } = await client
        .from('kori_transactions')
        .select('amount')
        .eq('from_wallet_id', walletId)
        .eq('transaction_type', 'tip')
        .eq('status', 'completed');

      if (error) {
        console.error('Error fetching spent Kori:', error);
        return 0;
      }

      const total = (data || []).reduce((sum, txn) => sum + parseFloat(txn.amount || 0), 0);
      return total;
    } catch (err) {
      console.error('PayoutService.getSpentKori error:', err);
      return 0;
    }
  }

  /**
   * Calculate total already withdrawn Kori
   * @param {string} walletId - Wallet UUID
   * @returns {Promise<number>}
   */
  static async getWithdrawnKori(walletId) {
    try {
      const client = db.getClient();
      
      const { data, error } = await client
        .from('kori_transactions')
        .select('amount')
        .eq('from_wallet_id', walletId)
        .eq('transaction_type', 'withdrawal')
        .in('status', ['completed', 'pending']);

      if (error) {
        console.error('Error fetching withdrawn Kori:', error);
        return 0;
      }

      const total = (data || []).reduce((sum, txn) => sum + parseFloat(txn.amount || 0), 0);
      return total;
    } catch (err) {
      console.error('PayoutService.getWithdrawnKori error:', err);
      return 0;
    }
  }

  /**
   * Calculate payoutable amount for a user
   * Payoutable = Earned - Given Out  (Tips given to others reduce payoutable)
   * @param {string} userId - User UUID
   * @returns {Promise<{payoutable: number, earned: number, spent: number, withdrawn: number}>}
   */
  static async getPayoutableAmount(userId) {
    try {
      const client = db.getClient();

      // Get user's wallet
      const { data: wallet, error: walletError } = await client
        .from('wallets')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (walletError || !wallet) {
        console.error('Wallet not found:', walletError);
        return {
          payoutable: 0,
          earned: 0,
          spent: 0,
          withdrawn: 0
        };
      }

      const walletId = wallet.id;

      // Get all components
      const earned = await this.getEarnedKori(walletId);
      const spent = await this.getSpentKori(walletId);
      const withdrawn = await this.getWithdrawnKori(walletId);

      // Payoutable = Earned - Given Out - Already Withdrawn
      // Never negative
      const payoutable = Math.max(0, earned - spent - withdrawn);

      return {
        payoutable,
        earned,
        spent,
        withdrawn
      };
    } catch (err) {
      console.error('PayoutService.getPayoutableAmount error:', err);
      return {
        payoutable: 0,
        earned: 0,
        spent: 0,
        withdrawn: 0
      };
    }
  }

  /**
   * Simulate what payout would look like (used for UI)
   * @param {string} userId - User UUID
   * @returns {Promise<{payoutable: number, breakdown: object}>}
   */
  static async simulatePayout(userId) {
    try {
      const payoutInfo = await this.getPayoutableAmount(userId);

      return {
        success: true,
        payoutable: payoutInfo.payoutable,
        breakdown: {
          earnedFromContent: 'সামগ্রী বিক্রয় থেকে অর্জিত',
          earnedFromTips: 'টিপ থেকে অর্জিত',
          earnedFromQuiz: 'কুইজ পুরস্কার থেকে অর্জিত',
          givenAsTips: 'অন্যদের টিপ দেওয়া',
          alreadyWithdrawn: 'ইতিমধ্যে উত্তোলিত',
          availableForPayout: payoutInfo.payoutable
        },
        earnings: {
          totalEarned: payoutInfo.earned,
          totalSpent: payoutInfo.spent,
          totalWithdrawn: payoutInfo.withdrawn
        },
        message: payoutInfo.payoutable > 0 
          ? `আপনি ${payoutInfo.payoutable.toFixed(2)} কড়ি উত্তোলন করতে পারেন`
          : 'এখনও কোনো উত্তোলনযোগ্য কড়ি নেই'
      };
    } catch (err) {
      console.error('PayoutService.simulatePayout error:', err);
      return {
        success: false,
        message: 'পেআউট তথ্য প্রাপ্ত করতে ব্যর্থ'
      };
    }
  }

  /**
   * Process actual payout (creates withdrawal transaction)
   * @param {string} userId - User UUID
   * @param {number} amount - Amount to withdraw (optional, defaults to all payoutable)
   * @returns {Promise<{success: boolean, message?: string, error?: string, transactionId?: string}>}
   */
  static async processPayout(userId, amount = null) {
    try {
      const client = db.getClient();

      // Get payoutable amount
      const payoutInfo = await this.getPayoutableAmount(userId);
      
      // Use requested amount or all payoutable
      const payoutAmount = amount || payoutInfo.payoutable;

      if (payoutAmount <= 0) {
        return {
          success: false,
          error: 'উত্তোলনের জন্য কোনো কড়ি নেই'
        };
      }

      if (payoutAmount > payoutInfo.payoutable) {
        return {
          success: false,
          error: `আপনি ${payoutInfo.payoutable} এর বেশি উত্তোলন করতে পারবেন না`
        };
      }

      // Get user's wallet
      const { data: wallet, error: walletError } = await client
        .from('wallets')
        .select('id, balance')
        .eq('user_id', userId)
        .single();

      if (walletError || !wallet) {
        return {
          success: false,
          error: 'ওয়ালেট খুঁজে পাওয়া যায়নি'
        };
      }

      // Check if wallet has balance (redundant but safe)
      if (wallet.balance < payoutAmount) {
        return {
          success: false,
          error: 'অপর্যাপ্ত ওয়ালেট ব্যালেন্স'
        };
      }

      const referenceId = `payout-${wallet.id.substring(0, 8)}-${Date.now()}`;
      const metadata = {
        user_id: userId,
        payout_type: 'writer_earnings',
        processed_at: new Date().toISOString()
      };

      // Deduct from wallet and create withdrawal transaction
      const { error: updateError } = await client
        .from('wallets')
        .update({
          balance: wallet.balance - payoutAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);

      if (updateError) {
        console.error('Error updating wallet for payout:', updateError);
        return {
          success: false,
          error: 'ওয়ালেট আপডেট করতে ব্যর্থ'
        };
      }

      // Create withdrawal transaction record
      const { data: transaction, error: transactionError } = await client
        .from('kori_transactions')
        .insert([
          {
            from_wallet_id: wallet.id,
            to_wallet_id: null,
            amount: payoutAmount,
            transaction_type: 'withdrawal',
            status: 'completed', // Simulated - in production would be 'pending' until processed by admin
            reference_id: referenceId,
            metadata: metadata,
            completed_at: new Date().toISOString()
          }
        ])
        .select('id');

      if (transactionError) {
        console.error('Error creating withdrawal transaction:', transactionError);
        return {
          success: false,
          error: 'লেনদেন রেকর্ড করতে ব্যর্থ'
        };
      }

      return {
        success: true,
        message: `${payoutAmount} কড়ি সফলভাবে উত্তোলন করা হয়েছে`,
        transactionId: transaction?.[0]?.id
      };
    } catch (err) {
      console.error('PayoutService.processPayout error:', err);
      return {
        success: false,
        error: 'উত্তোলন প্রক্রিয়া ব্যর্থ হয়েছে'
      };
    }
  }
}

module.exports = PayoutService;
