import type { Request, Response, NextFunction } from 'express';
/**
 * Reading Preferences Controller
 * Handles reading preferences operations
 */

import ReadingPreferencesRepository from '../repositories/ReadingPreferencesRepository';

export const getPreferences = async (req: Request, res: Response) => {
    try {
        let preferences = await ReadingPreferencesRepository.findByUser(req.user.id);
        
        // If no preferences exist, return defaults
        if (!preferences) {
            preferences = {
                theme: 'light',
                font_size: 'medium',
                font_family: 'Kalpurush',
                line_height: 'normal'
            };
        }
        
        res.json({ success: true, data: preferences });
    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updatePreferences = async (req: Request, res: Response) => {
    try {
        const allowedFields = ['theme', 'font_size', 'font_family', 'line_height'];
        const updates = {};
        
        Object.keys(req.body).forEach(key => {
            if (allowedFields.includes(key)) {
                updates[key] = req.body[key];
            }
        });
        
        const preferences = await ReadingPreferencesRepository.createOrUpdate(req.user.id, updates);
        res.json({ success: true, data: preferences });
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};