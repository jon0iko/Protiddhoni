import type { Request, Response, NextFunction } from 'express';
/**
 * Notifications Routes
 */

import express from 'express';
const router = express.Router();
import NotificationService from '../services/notificationService';
import db from '../config/database';
import { authenticate } from '../middleware/auth';

// Get user notifications
router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
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
router.get('/unread-count', authenticate, async (req: Request, res: Response) => {
    try {
        const { data, error } = await db.getClient()
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
router.put('/:id/read', authenticate, async (req: Request, res: Response) => {
    try {
        await NotificationService.markAsRead(req.params.id);
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Mark all as read
router.put('/read-all', authenticate, async (req: Request, res: Response) => {
    try {
        await NotificationService.markAllAsRead(req.user.id);
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
