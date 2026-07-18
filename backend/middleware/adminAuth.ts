import type { Request, Response, NextFunction } from 'express';
/**
 * Admin Authorization Middleware
 * Requires the authenticated user to have the `is_admin` flag set in the
 * `users` table. Re-fetches from DB so a token issued before promotion
 * cannot still grant access.
 */

import UserRepository from '../repositories/UserRepository';

const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        // Trust JWT payload first, then verify against DB to defend
        // against stale tokens (e.g., admin flag revoked).
        const user = await UserRepository.findById(req.user.id);
        if (!user || !user.is_admin) {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }

        req.user.is_admin = true;
        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        res.status(500).json({ success: false, error: 'Failed to verify admin privileges' });
    }
};

export { requireAdmin };
