/**
 * Design Pattern: Observer
 */

const db = require('../config/database');

class NotificationService {
    constructor() {
        this.observers = new Map();
    }

    // Subscribe followers to an author
    async subscribe(authorId, followerId) {
        // TODO: Implement subscription logic
    }

    // Unsubscribe follower from an author
    async unsubscribe(authorId, followerId) {
        // TODO: Implement unsubscribe logic
    }

    // Notify all followers when author publishes
    async notifyFollowers(authorId, content) {
        // TODO: Implement notification logic
        const { data: followers } = await db.getClient()
            .from('follows')
            .select('follower_id')
            .eq('following_id', authorId);

        if (!followers) return;

        const notifications = followers.map(f => ({
            user_id: f.follower_id,
            type: 'new_content',
            title: 'New Content Published',
            message: `New content: ${content.title}`,
            related_entity_type: 'content',
            related_entity_id: content.id
        }));

        await db.getClient()
            .from('notifications')
            .insert(notifications);
    }

    // Notify author of new review
    async notifyAuthorOfReview(authorId, review) {
        // TODO: Implement review notification
    }

    // Notify author of content approval
    async notifyContentApproved(authorId, content) {
        // TODO: Implement approval notification
    }

    // Notify author of content rejection
    async notifyContentRejected(authorId, content, reason) {
        // TODO: Implement rejection notification
    }
}

module.exports = new NotificationService();
