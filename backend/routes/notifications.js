/**
 * Notifications Routes
 */

const express = require('express');
const router = express.Router();
const NotificationService = require('../services/notificationService');
const { authenticate } = require('../middleware/auth');

// Get user notifications
router.get('/', authenticate, async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;
        const notifications = await NotificationService.getUserNotifications(req.user.id, limit);
        
        res.json({ 
            success: true, 
            data: notifications,
            count: notifications.length 
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get unread count
router.get('/unread-count', authenticate, async (req, res) => {
    try {
        const { data, error } = await require('../config/database').getClient()
            .from('notifications')
            .select('id', { count: 'exact' })
            .eq('user_id', req.user.id)
            .eq('is_read', false);

        if (error) throw error;

        res.json({ 
            success: true, 
            count: data?.length || 0
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Mark notification as read
router.put('/:id/read', authenticate, async (req, res) => {
    try {
        await NotificationService.markAsRead(req.params.id);
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Mark all as read
router.put('/read-all', authenticate, async (req, res) => {
    try {
        await NotificationService.markAllAsRead(req.user.id);
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
