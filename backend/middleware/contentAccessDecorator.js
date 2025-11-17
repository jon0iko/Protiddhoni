/**
 * Design Pattern: Decorator
 */

// Base component for content access
class ContentAccess {
    async checkAccess(userId, contentId) {
        return { granted: true };
    }
}

// Decorator that adds paywall functionality
class PaywallDecorator extends ContentAccess {
    constructor(contentAccess, db) {
        super();
        this.wrappedAccess = contentAccess;
        this.db = db;
    }

    async checkAccess(userId, contentId) {
        // First check base access
        const baseAccess = await this.wrappedAccess.checkAccess(userId, contentId);
        
        if (!baseAccess.granted) {
            return baseAccess;
        }

        // Check if content is premium
        const { data: content, error: contentError } = await this.db.getClient()
            .from('content')
            .select('is_premium')
            .eq('id', contentId)
            .single();

        if (contentError || !content) {
            return { granted: false, reason: 'content_not_found', message: 'Content not found' };
        }

        // If content is not premium, grant access
        if (!content.is_premium) {
            return { granted: true };
        }

        // Check if user has purchased the premium content
        const { data: purchase, error: purchaseError } = await this.db.getClient()
            .from('purchases')
            .select('id')
            .eq('user_id', userId)
            .eq('content_id', contentId)
            .eq('payment_status', 'completed')
            .single();

        if (purchase) {
            return { granted: true };
        }

        return { 
            granted: false, 
            reason: 'premium_content', 
            message: 'This content requires purchase' 
        };
    }
}

module.exports = { ContentAccess, PaywallDecorator };
