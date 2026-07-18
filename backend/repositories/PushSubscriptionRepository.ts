/**
 * Push Subscription Repository
 * Handles push subscription database operations
 */

import db from '../config/database';

class PushSubscriptionRepository {
    async save(userId, subscription) {
        const { data, error } = await db.getClient()
            .from('push_subscriptions')
            .upsert({
                user_id: userId,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth
            }, { onConflict: 'user_id,endpoint' })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async findByUserId(userId) {
        const { data, error } = await db.getClient()
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;
        return data || [];
    }

    async findByUserIds(userIds) {
        if (!userIds || userIds.length === 0) return [];

        const { data, error } = await db.getClient()
            .from('push_subscriptions')
            .select('*')
            .in('user_id', userIds);

        if (error) throw error;
        return data || [];
    }

    async deleteByEndpoint(endpoint) {
        const { error } = await db.getClient()
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', endpoint);

        if (error) throw error;
        return true;
    }

    async deleteByUserAndEndpoint(userId, endpoint) {
        const { error } = await db.getClient()
            .from('push_subscriptions')
            .delete()
            .eq('user_id', userId)
            .eq('endpoint', endpoint);

        if (error) throw error;
        return true;
    }
}

export default new PushSubscriptionRepository();
