/**
 * Design Pattern: Decorator
 * Implements a paywall system to protect premium content
 */

// Base component for content access
class ContentAccess {
    async checkAccess(user, contentId) {
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

    async checkAccess(user, contentId) {
        // First check base access
        const baseAccess = await this.wrappedAccess.checkAccess(user, contentId);
        
        if (!baseAccess.granted) {
            return baseAccess;
        }

        // Check if content is premium
        const { data: content, error: contentError } = await this.db.getClient()
            .from('content')
            .select('is_premium, price, title, author_id')
            .eq('id', contentId)
            .single();

        if (contentError || !content) {
            return { 
                granted: false, 
                reason: 'content_not_found', 
                message: 'Content not found',
                requiresPayment: false
            };
        }

        // If content is not premium, grant access
        if (!content.is_premium) {
            return { granted: true, requiresPayment: false };
        }

        // If no user is logged in for premium content, deny access
        if (!user || !user.id) {
            return { 
                granted: false, 
                reason: 'premium_content_requires_auth', 
                message: 'This premium content requires login',
                requiresPayment: true,
                contentDetails: {
                    id: contentId,
                    title: content.title,
                    price: content.price || 0
                }
            };
        }

        // If user is admin, grant access (admins can access all premium content)
        if (user.is_admin) {
            return { granted: true, requiresPayment: false };
        }

        // If user is the author, grant access
        if (user.id === content.author_id) {
            return { granted: true, requiresPayment: false };
        }

        // Check if user has purchased the premium content
        const { data: purchase, error: purchaseError } = await this.db.getClient()
            .from('content_purchases')
            .select('id, amount')
            .eq('user_id', user.id)
            .eq('content_id', contentId)
            .single();

        if (purchase) {
            return { granted: true, requiresPayment: false };
        }

        // Premium content not purchased - block access
        return { 
            granted: false, 
            reason: 'premium_content_not_purchased', 
            message: 'This premium content requires purchase to access',
            requiresPayment: true,
            contentDetails: {
                id: contentId,
                title: content.title,
                price: content.price || 0
            }
        };
    }
}

module.exports = { ContentAccess, PaywallDecorator };
