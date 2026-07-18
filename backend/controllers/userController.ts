import type { Request, Response, NextFunction } from 'express';
/**
 * User Controller
 * Handles user profile, follow/unfollow
 */

import UserRepository from '../repositories/UserRepository';
import ContentRepository from '../repositories/ContentRepository';
import SeriesRepository from '../repositories/SeriesRepository';
import NotificationService from '../services/notificationService';

export const getProfile = async (req: Request, res: Response) => {
    try {
        const username = req.params.username;
        console.log('Getting profile for username:', username);
        
        const user = await UserRepository.findByUsername(String(username));
        
        if (!user) {
            console.log('User not found:', username);
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        console.log('User found:', user.username);

        // Get user stats
        const stats = await UserRepository.getUserStats(user.id);
        user.stats = stats;

        // Check if current user is following this user
        if (req.user) {
            user.isFollowing = await UserRepository.isFollowing(req.user.id, user.id);
        } else {
            user.isFollowing = false;
        }

        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        // User can only update their own profile
        if (req.user.id !== req.params.userId && !req.user.is_admin) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        const allowedUpdates = ['full_name', 'bio', 'profile_picture_url'];
        const updates = {};
        
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        const user = await UserRepository.update(req.params.userId, updates);
        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const follow = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        if (req.user.id === userId) {
            return res.status(400).json({ success: false, error: 'Cannot follow yourself' });
        }

        const targetUser = await UserRepository.findById(String(userId));
        if (!targetUser) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Check if already following
        const isFollowing = await UserRepository.isFollowing(req.user.id, userId);
        if (isFollowing) {
            return res.status(400).json({ success: false, error: 'Already following this user' });
        }

        await UserRepository.follow(req.user.id, userId);

        // Notify the followed user. Fetch follower profile so the notification
        // shows their full name; fall back to username if not available.
        try {
            const follower = await UserRepository.findById(req.user.id);
            if (follower) {
                await NotificationService.notifyNewFollower(userId, {
                    id: follower.id,
                    full_name: follower.full_name || follower.username
                });
            }
        } catch (notifyError) {
            console.error('Error sending new-follower notification:', notifyError);
        }

        res.json({ success: true, message: 'Followed successfully' });
    } catch (error) {
        console.error('Follow error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const unfollow = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        await UserRepository.unfollow(req.user.id, userId);
        res.json({ success: true, message: 'Unfollowed successfully' });
    } catch (error) {
        console.error('Unfollow error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getFollowers = async (req: Request, res: Response) => {
    try {
        const followers = await UserRepository.getFollowers(req.params.userId);
        res.json({ success: true, data: followers, count: followers.length });
    } catch (error) {
        console.error('Get followers error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getFollowing = async (req: Request, res: Response) => {
    try {
        const following = await UserRepository.getFollowing(req.params.userId);
        res.json({ success: true, data: following, count: following.length });
    } catch (error) {
        console.error('Get following error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getContent = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        
        // Check if it's a username or UUID
        let user;
        if (String(userId).match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            // It's a UUID
            user = await UserRepository.findById(String(userId));
        } else {
            // It's a username
            user = await UserRepository.findByUsername(String(userId));
        }

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const contents = await ContentRepository.findByAuthor(user.id);
        res.json({ success: true, data: contents, count: contents.length });
    } catch (error) {
        console.error('Get user content error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getSeries = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        
        // Check if it's a username or UUID
        let user;
        if (String(userId).match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            // It's a UUID
            user = await UserRepository.findById(String(userId));
        } else {
            // It's a username
            user = await UserRepository.findByUsername(String(userId));
        }

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const series = await SeriesRepository.findByAuthor(user.id);
        res.json({ success: true, data: series, count: series.length });
    } catch (error) {
        console.error('Get user series error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
