/**
 * Content Purchase Controller
 * Handles premium content purchase requests
 */

const ContentPurchaseService = require('../services/contentPurchaseService');
const db = require('../config/database');

class ContentPurchaseController {
  /**
   * Check if user has purchased content
   * GET /api/payments/check-purchase/:contentId
   */
  static async checkPurchase(req, res) {
    try {
      const { contentId } = req.params;
      const userId = req.user.id;

      if (!contentId) {
        return res.status(400).json({ error: 'content ID needed' });
      }

      const hasPurchased = await ContentPurchaseService.hasPurchased(userId, contentId);

      return res.json({
        success: true,
        hasPurchased,
        message: hasPurchased ? 'ক্রয় করা' : 'ক্রয় করা হয়নি'
      });
    } catch (error) {
      console.error('ContentPurchaseController.checkPurchase error:', error);
      return res.status(500).json({ error: 'অপ্রত্যাশিত ত্রুটি' });
    }
  }

  /**
   * Purchase premium content
   * POST /api/payments/purchase-content/:contentId
   * Body: { amount: number }
   */
  static async purchaseContent(req, res) {
    try {
      const { contentId } = req.params;
      const userId = req.user.id;
      const { amount } = req.body;

      if (!contentId) {
        return res.status(400).json({ error: 'সামগ্রী ID প্রয়োজন' });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'সামগ্রী পৃষ্ঠ ভুল' });
      }

      // Verify that the content exists and get its price
      const client = db.getClient();
      const { data: content, error: contentError } = await client
        .from('content')
        .select('id, price, title, is_premium')
        .eq('id', contentId)
        .single();

      if (contentError || !content) {
        console.error('Content not found:', contentError);
        return res.status(404).json({ error: 'সামগ্রী পাওয়া যায়নি' });
      }

      if (!content.is_premium) {
        return res.status(400).json({ error: 'এই সামগ্রী প্রিমিয়াম নয়' });
      }

      // Verify the price matches
      if (parseFloat(content.price) !== parseFloat(amount)) {
        return res.status(400).json({ 
          error: 'মূল্য মেলে না',
          expectedPrice: content.price,
          providedPrice: amount
        });
      }

      // Prevent self-purchase
      const { data: contentData } = await client
        .from('content')
        .select('author_id')
        .eq('id', contentId)
        .single();

      if (contentData && contentData.author_id === userId) {
        return res.status(400).json({ error: 'নিজের কন্টেন্ট ক্রয় করতে পারবেন না' });
      }

      // Process the purchase
      const result = await ContentPurchaseService.purchaseContent(userId, contentId, amount);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.json({
        success: true,
        message: result.message,
        contentTitle: content.title
      });
    } catch (error) {
      console.error('ContentPurchaseController.purchaseContent error:', error);
      return res.status(500).json({ error: 'অপ্রত্যাশিত ত্রুটি' });
    }
  }

  /**
   * Get user's purchased content list
   * GET /api/payments/purchases
   */
  static async getUserPurchases(req, res) {
    try {
      const userId = req.user.id;

      const purchases = await ContentPurchaseService.getUserPurchases(userId);

      return res.json({
        success: true,
        data: purchases,
        total: purchases.length
      });
    } catch (error) {
      console.error('ContentPurchaseController.getUserPurchases error:', error);
      return res.status(500).json({ error: 'অপ্রত্যাশিত ত্রুটি' });
    }
  }
}

module.exports = ContentPurchaseController;
