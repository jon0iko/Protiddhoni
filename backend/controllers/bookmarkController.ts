import type { Request, Response, NextFunction } from 'express';
/**
 * Bookmark Controller
 * Handles bookmark operations
 */

import BookmarkRepository from '../repositories/BookmarkRepository';

export const getMyBookmarks = async (req: Request, res: Response) => {
    try {
        const bookmarks = await BookmarkRepository.findByUser(req.user.id);
        res.json({ success: true, data: bookmarks, count: bookmarks.length });
    } catch (error) {
        console.error('Get bookmarks error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const addBookmark = async (req: Request, res: Response) => {
    try {
        const { contentId } = req.body;
        
        if (!contentId) {
            return res.status(400).json({ success: false, error: 'Content ID is required' });
        }

        // Check if already bookmarked
        const existing = await BookmarkRepository.findByUserAndContent(req.user.id, contentId);
        if (existing) {
            return res.status(400).json({ success: false, error: 'Already bookmarked' });
        }

        const bookmark = await BookmarkRepository.create(req.user.id, contentId);
        res.status(201).json({ success: true, data: bookmark });
    } catch (error) {
        console.error('Add bookmark error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const removeBookmark = async (req: Request, res: Response) => {
    try {
        const { contentId } = req.params;
        
        await BookmarkRepository.delete(req.user.id, contentId);
        res.json({ success: true, message: 'Bookmark removed successfully' });
    } catch (error) {
        console.error('Remove bookmark error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const checkBookmark = async (req: Request, res: Response) => {
    try {
        const { contentId } = req.params;
        
        const bookmark = await BookmarkRepository.findByUserAndContent(req.user.id, contentId);
        res.json({ success: true, isBookmarked: !!bookmark });
    } catch (error) {
        console.error('Check bookmark error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};