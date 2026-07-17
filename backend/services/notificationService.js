/**
 * Design Pattern: Observer
 * Notification service for user events
 */

const db = require('../config/database');
const pushService = require('./pushService');

class NotificationService {
    constructor() {
        this.observers = new Map();
    }

    // Subscribe followers to an author (when user follows)
    async subscribe(authorId, followerId) {
        if (!this.observers.has(authorId)) {
            this.observers.set(authorId, new Set());
        }
        this.observers.get(authorId).add(followerId);
    }

    // Unsubscribe follower from an author (when user unfollows)
    async unsubscribe(authorId, followerId) {
        if (this.observers.has(authorId)) {
            this.observers.get(authorId).delete(followerId);
        }
    }

    // Notify all followers when author publishes new content
    async notifyFollowers(authorId, content) {
        try {
            const { data: followers } = await db.getClient()
                .from('follows')
                .select('follower_id')
                .eq('following_id', authorId);

            if (!followers || followers.length === 0) return;

            const notifications = followers.map(f => ({
                user_id: f.follower_id,
                type: 'new_content',
                title: 'নতুন লেখা প্রকাশিত',
                message: `আপনার অনুসরণকৃত লেখক একটি নতুন লেখা প্রকাশ করেছেন: ${content.title}`,
                related_entity_type: 'content',
                related_entity_id: content.id
            }));

            await db.getClient()
                .from('notifications')
                .insert(notifications);

            // Send push notifications to followers
            const followerIds = followers.map(f => f.follower_id);
            await pushService.sendToUsers(followerIds, {
                title: 'নতুন লেখা প্রকাশিত',
                body: `নতুন লেখা: ${content.title}`,
                url: `/read/${content.slug || content.id}`,
                icon: '/icons/icon-192.png'
            });

            return followerIds;
        } catch (error) {
            console.error('Error notifying followers:', error);
        }
    }

    // Notify author of new review
    async notifyAuthorOfReview(content, review) {
        try {
            await db.getClient()
                .from('notifications')
                .insert({
                    user_id: content.author_id,
                    type: 'new_review',
                    title: 'নতুন রিভিউ',
                    message: `আপনার লেখা "${content.title}" তে নতুন রিভিউ এসেছে`,
                    related_entity_type: 'review',
                    related_entity_id: review.id
                });
        } catch (error) {
            console.error('Error notifying author of review:', error);
        }
    }

    // Notify author of content approval
    async notifyContentApproved(content) {
        try {
            await db.getClient()
                .from('notifications')
                .insert({
                    user_id: content.author_id,
                    type: 'content_approved',
                    title: 'লেখা অনুমোদিত হয়েছে',
                    message: `আপনার লেখা "${content.title}" অনুমোদিত এবং প্রকাশিত হয়েছে`,
                    related_entity_type: 'content',
                    related_entity_id: content.id
                });

            // Push notification to author about approval
            await pushService.sendToUser(content.author_id, {
                title: 'লেখা অনুমোদিত হয়েছে',
                body: `আপনার লেখা "${content.title}" প্রকাশিত হয়েছে`,
                url: `/read/${content.slug || content.id}`,
                icon: '/icons/icon-192.png'
            });

            // Also notify followers (includes push)
            await this.notifyFollowers(content.author_id, content);
        } catch (error) {
            console.error('Error notifying content approval:', error);
        }
    }

    // Notify author of content rejection
    async notifyContentRejected(content) {
        try {
            await db.getClient()
                .from('notifications')
                .insert({
                    user_id: content.author_id,
                    type: 'content_rejected',
                    title: 'লেখা প্রত্যাখ্যাত হয়েছে',
                    message: `আপনার লেখা "${content.title}" প্রত্যাখ্যাত হয়েছে। কারণ: ${content.rejection_reason}`,
                    related_entity_type: 'content',
                    related_entity_id: content.id
                });
        } catch (error) {
            console.error('Error notifying content rejection:', error);
        }
    }

    // Notify author that their content has been unpublished by admin
    async notifyContentUnpublished(content) {
        try {
            const reasonSuffix = content.unpublish_reason
                ? ` কারণ: ${content.unpublish_reason}`
                : '';

            await db.getClient()
                .from('notifications')
                .insert({
                    user_id: content.author_id,
                    type: 'content_unpublished',
                    title: 'লেখা অপ্রকাশিত হয়েছে',
                    message: `আপনার লেখা "${content.title}" অপ্রকাশিত করা হয়েছে।${reasonSuffix}`,
                    related_entity_type: 'content',
                    related_entity_id: content.id
                });

            // Push notification to author
            await pushService.sendToUser(content.author_id, {
                title: 'লেখা অপ্রকাশিত হয়েছে',
                body: `আপনার লেখা "${content.title}" অপ্রকাশিত করা হয়েছে`,
                url: `/profile`,
                icon: '/icons/icon-192.png'
            });
        } catch (error) {
            console.error('Error notifying content unpublished:', error);
        }
    }

    // Notify author that their content has been republished by admin
    async notifyContentRepublished(content) {
        try {
            await db.getClient()
                .from('notifications')
                .insert({
                    user_id: content.author_id,
                    type: 'content_republished',
                    title: 'লেখা পুনরায় প্রকাশিত হয়েছে',
                    message: `আপনার লেখা "${content.title}" পুনরায় প্রকাশিত হয়েছে`,
                    related_entity_type: 'content',
                    related_entity_id: content.id
                });

            // Push notification to author
            await pushService.sendToUser(content.author_id, {
                title: 'লেখা পুনরায় প্রকাশিত',
                body: `আপনার লেখা "${content.title}" পুনরায় প্রকাশিত হয়েছে`,
                url: `/read/${content.slug || content.id}`,
                icon: '/icons/icon-192.png'
            });
        } catch (error) {
            console.error('Error notifying content republished:', error);
        }
    }


    // Notify user of new follower
    async notifyNewFollower(followedUserId, followerUser) {
        try {
            await db.getClient()
                .from('notifications')
                .insert({
                    user_id: followedUserId,
                    type: 'new_follower',
                    title: 'নতুন অনুসরণকারী',
                    message: `${followerUser.full_name} আপনাকে অনুসরণ করতে শুরু করেছেন`,
                    related_entity_type: 'user',
                    related_entity_id: followerUser.id
                });
        } catch (error) {
            console.error('Error notifying new follower:', error);
        }
    }

    // Get user notifications
    async getUserNotifications(userId, limit = 20) {
        try {
            const { data, error } = await db.getClient()
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting notifications:', error);
            return [];
        }
    }

    // Mark notification as read
    async markAsRead(notificationId) {
        try {
            await db.getClient()
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    // Mark all user notifications as read
    async markAllAsRead(userId) {
        try {
            await db.getClient()
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', userId)
                .eq('is_read', false);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }
}

module.exports = new NotificationService();
