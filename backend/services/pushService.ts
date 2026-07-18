/**
 * Push Service
 * Handles sending Web Push notifications via VAPID protocol
 */

import webpush from 'web-push';
import PushSubscriptionRepository from '../repositories/PushSubscriptionRepository';

class PushService {
    private enabled: boolean;

    constructor() {
        const publicKey = process.env.VAPID_PUBLIC_KEY;
        const privateKey = process.env.VAPID_PRIVATE_KEY;
        const subject = process.env.VAPID_SUBJECT || 'mailto:protiddhoni@example.com';

        if (publicKey && privateKey) {
            webpush.setVapidDetails(subject, publicKey, privateKey);
            this.enabled = true;
        } else {
            console.warn('⚠️ VAPID keys not configured. Push notifications disabled.');
            this.enabled = false;
        }
    }

    async sendToUsers(userIds, payload) {
        if (!this.enabled || !userIds || userIds.length === 0) return;

        try {
            const subscriptions = await PushSubscriptionRepository.findByUserIds(userIds);
            if (subscriptions.length === 0) return;

            const payloadString = JSON.stringify(payload);

            const results = await Promise.allSettled(
                subscriptions.map(sub =>
                    webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: { p256dh: sub.p256dh, auth: sub.auth }
                        },
                        payloadString
                    ).catch(async (err) => {
                        // 410 Gone or 404 — subscription expired, clean up
                        if (err.statusCode === 410 || err.statusCode === 404) {
                            await PushSubscriptionRepository.deleteByEndpoint(sub.endpoint);
                        }
                        throw err;
                    })
                )
            );

            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            if (failed > 0) {
                console.log(`Push notifications: ${succeeded} sent, ${failed} failed`);
            }
        } catch (error) {
            console.error('Error sending push notifications:', error);
        }
    }

    async sendToUser(userId, payload) {
        return this.sendToUsers([userId], payload);
    }
}

export default new PushService();
