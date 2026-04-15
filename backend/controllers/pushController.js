/**
 * Push Controller
 * Handles push subscription management endpoints
 */

const PushSubscriptionRepository = require('../repositories/PushSubscriptionRepository');

exports.getVapidPublicKey = (req, res) => {
    const key = process.env.VAPID_PUBLIC_KEY;
    if (!key) {
        return res.status(500).json({ success: false, error: 'VAPID keys not configured' });
    }
    res.json({ success: true, key });
};

exports.subscribe = async (req, res) => {
    try {
        const { endpoint, keys } = req.body;

        if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
            return res.status(400).json({
                success: false,
                error: 'Invalid subscription: endpoint and keys (p256dh, auth) required'
            });
        }

        const subscription = await PushSubscriptionRepository.save(req.user.id, {
            endpoint,
            keys
        });

        res.status(201).json({ success: true, data: subscription });
    } catch (error) {
        console.error('Push subscribe error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.unsubscribe = async (req, res) => {
    try {
        const { endpoint } = req.body;

        if (!endpoint) {
            return res.status(400).json({
                success: false,
                error: 'Endpoint required'
            });
        }

        await PushSubscriptionRepository.deleteByUserAndEndpoint(req.user.id, endpoint);
        res.json({ success: true, message: 'Unsubscribed successfully' });
    } catch (error) {
        console.error('Push unsubscribe error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
