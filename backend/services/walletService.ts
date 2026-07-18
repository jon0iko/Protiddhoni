import type { SupabaseClient } from '@supabase/supabase-js';
import db from '../config/database';
import logger from '../config/logger';

class WalletService {
  private supabase: SupabaseClient;
  private logger: typeof logger;

  constructor() {
    this.supabase = db.getClient();
    this.logger = logger;
  }

  /**
   * Retrieves a wallet by User ID.
   * @param {string} userId - UUID of the user.
   * @returns {Promise<Object>} The wallet object.
   */
  async getWalletByUserId(userId) {
    try {
      const { data, error } = await this.supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // Ignore row not found error
        throw error;
      }
      return data;
    } catch (error) {
      this.logger.error('Error fetching wallet:', error);
      throw new Error('Failed to retrieve wallet information');
    }
  }

  /**
   * Atomically transfers Kori between two wallets using the PostgreSQL RPC function.
   * Eliminates race conditions preventing double-spend and balances dropping below zero.
   *
   * @param {string} senderUserId - Sender's UUID.
   * @param {string} receiverUserId - Receiver's UUID.
   * @param {number} amount - Amount of Kori to transfer.
   * @param {string} metadata - (Optional) details of the transaction, ex: chapter tipped.
   * @returns {Promise<string>} The new Transaction UUID.
   */
  async transferKori(senderUserId, receiverUserId, amount, type = 'tip', metadata = {}) {
    try {
      // Step 1: Ensure both users have wallets, get wallet IDs
      const [senderWallet, receiverWallet] = await Promise.all([
        this.getWalletByUserId(senderUserId),
        this.getWalletByUserId(receiverUserId)
      ]);

      if (!senderWallet) throw new Error('Sender wallet not found');
      if (!receiverWallet) throw new Error('Receiver wallet not found');

      const referenceId = `KORI-TRX-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      // Step 2: Invoke atomic RPC function
      // transfer_kori handles the row-level locking constraint
      const { data: transactionId, error } = await this.supabase.rpc('transfer_kori', {
        sender_wallet_id: senderWallet.id,
        receiver_wallet_id: receiverWallet.id,
        transfer_amount: amount,
        trx_type: type,
        trx_reference_id: referenceId,
        trx_metadata: metadata
      });

      if (error) {
        this.logger.error('RPC Error on Kori Transfer:', error);
        throw new Error(error.message || 'Transaction failed');
      }

      this.logger.info(`Successfully transferred ${amount} Kori from ${senderWallet.id} to ${receiverWallet.id}`);
      return transactionId;
    } catch (error) {
      this.logger.error('WalletService logic failed during transfer:', error);
      throw error;
    }
  }

  /**
   * Credit Kori to a user's wallet manually (E.g. Webhook successful purchase)
   *
   * @param {string} userId
   * @param {number} amount
   * @param {string} externalReferenceId (e.g. Bkash Transaction ID)
   * @returns {Promise<string>} Transaction ID
   */
  async topUpWallet(userId, amount, externalReferenceId) {
    // TopUp logic should ideally use a stored procedure similar to transfer_kori, 
    // or standard transactional inserts since inserting into from_wallet_id is NULL here.
    
    // Using simple approach but in a safe locking way since there's no sender to lock:
    const wallet = await this.getWalletByUserId(userId);
    if (!wallet) throw new Error('Wallet not found');

    const { data: newBalance, error } = await this.supabase.rpc('top_up_kori', {
        target_wallet_id: wallet.id,
        topup_amount: amount,
        trx_type: 'purchase',
        trx_reference_id: externalReferenceId
    });

    if (error) {
      throw new Error(error.message);
    }
    return newBalance;
  }
}

export default new WalletService();