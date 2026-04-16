/**
 * Content Purchase Service
 * Handles premium content purchases and verification
 */

const db = require('../config/database');

class ContentPurchaseService {
  /**
   * Check if user has purchased specific content
   * @param {string} userId - User UUID
   * @param {string} contentId - Content UUID
   * @returns {Promise<boolean>}
   */
  static async hasPurchased(userId, contentId) {
    try {
      const client = db.getClient();
      
      const { data, error } = await client
        .from('content_purchases')
        .select('id')
        .eq('user_id', userId)
        .eq('content_id', contentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found
        console.error('Error checking purchase:', error);
        return false;
      }

      return !!data;
    } catch (err) {
      console.error('ContentPurchaseService.hasPurchased error:', err);
      return false;
    }
  }

  /**
   * Get purchase details for content
   * @param {string} userId - User UUID
   * @param {string} contentId - Content UUID
   * @returns {Promise<object|null>}
   */
  static async getPurchaseDetails(userId, contentId) {
    try {
      const client = db.getClient();
      
      const { data, error } = await client
        .from('content_purchases')
        .select('*')
        .eq('user_id', userId)
        .eq('content_id', contentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error getting purchase details:', error);
        return null;
      }

      return data || null;
    } catch (err) {
      console.error('ContentPurchaseService.getPurchaseDetails error:', err);
      return null;
    }
  }

  /**
   * Record a content purchase
   * Transfers Kori from buyer to author using peer-to-peer transfer
   * @param {string} userId - User UUID (buyer)
   * @param {string} contentId - Content UUID
   * @param {number} amount - Amount in Kori
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async purchaseContent(userId, contentId, amount) {
    try {
      const client = db.getClient();

      // Check if already purchased
      const alreadyPurchased = await this.hasPurchased(userId, contentId);
      if (alreadyPurchased) {
        return {
          success: false,
          error: 'সামগ্রী ইতিমধ্যে ক্রয় করেছেন'
        };
      }

      // Get content with author info
      const { data: contentData, error: contentError } = await client
        .from('content')
        .select('id, title, author_id, price')
        .eq('id', contentId)
        .single();

      if (contentError || !contentData) {
        console.error('Error fetching content:', contentError);
        return { success: false, error: 'সামগ্রী খুঁজে পাওয়া যায়নি' };
      }

      // Prevent author from buying their own content
      if (contentData.author_id === userId) {
        return {
          success: false,
          error: 'নিজের সামগ্রী ক্রয় করতে পারবেন না'
        };
      }

      // Get buyer wallet
      const { data: buyerWallet, error: buyerWalletError } = await client
        .from('wallets')
        .select('id, balance')
        .eq('user_id', userId)
        .single();

      if (buyerWalletError || !buyerWallet) {
        console.error('Error fetching buyer wallet:', buyerWalletError);
        return { success: false, error: 'ওয়ালেট খুঁজে পাওয়া যায়নি' };
      }

      if (buyerWallet.balance < amount) {
        return {
          success: false,
          error: 'পর্যাপ্ত কড়ি নেই'
        };
      }

      // Get author wallet
      const { data: authorWallet, error: authorWalletError } = await client
        .from('wallets')
        .select('id')
        .eq('user_id', contentData.author_id)
        .single();

      if (authorWalletError || !authorWallet) {
        console.error('Error fetching author wallet:', authorWalletError);
        return { success: false, error: 'লেখকের ওয়ালেট খুঁজে পাওয়া যায়নি' };
      }

      const referenceId = `content-purchase-${contentId.substring(0, 8)}-${Date.now()}`;
      const metadata = {
        content_id: contentId,
        content_title: contentData.title,
        author_id: contentData.author_id
      };

      // Execute peer-to-peer transfer using RPC (atomic operation)
      const { data: transactionId, error: rpcError } = await client
        .rpc('transfer_kori', {
          sender_wallet_id: buyerWallet.id,
          receiver_wallet_id: authorWallet.id,
          transfer_amount: amount,
          trx_type: 'content_purchase',
          trx_reference_id: referenceId,
          trx_metadata: metadata
        });

      if (rpcError) {
        console.error('Error executing transfer_kori RPC:', rpcError);
        
        // Handle specific error messages
        if (rpcError.message?.includes('Insufficient funds')) {
          return { success: false, error: 'পর্যাপ্ত কড়ি নেই' };
        }
        
        return { success: false, error: 'লেনদেন প্রক্রিয়া করতে ব্যর্থ' };
      }

      // Record the purchase
      const { error: purchaseError } = await client
        .from('content_purchases')
        .insert([
          {
            user_id: userId,
            content_id: contentId,
            amount: amount
          }
        ]);

      if (purchaseError) {
        console.error('Error recording purchase:', purchaseError);
        // Transfer succeeded but purchase record failed - this is a data consistency issue
        // but user got content access through decorator check
        return { 
          success: true,
          message: 'সামগ্রী সফলভাবে ক্রয় করা হয়েছে (রেকর্ড রাখতে ত্রুটি)',
          warning: true
        };
      }

      return { 
        success: true,
        message: 'সামগ্রী সফলভাবে ক্রয় করা হয়েছে',
        transaction_id: transactionId
      };
    } catch (err) {
      console.error('ContentPurchaseService.purchaseContent error:', err);
      return { success: false, error: 'অপ্রত্যাশিত ত্রুটি' };
    }
  }

  /**
   * Get all purchased content by user
   * @param {string} userId - User UUID
   * @returns {Promise<Array>}
   */
  static async getUserPurchases(userId) {
    try {
      const client = db.getClient();
      
      const { data, error } = await client
        .from('content_purchases')
        .select('content_id, amount, purchased_at')
        .eq('user_id', userId)
        .order('purchased_at', { ascending: false });

      if (error) {
        console.error('Error fetching user purchases:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('ContentPurchaseService.getUserPurchases error:', err);
      return [];
    }
  }
}

module.exports = ContentPurchaseService;
