/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user to request
 */

const jwt = require('jsonwebtoken');

/**
 * Required authentication - blocks request if no valid token
 */
const authenticate = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
};

/**
 * Optional authentication - allows request with or without token
 * Attaches user to req.user if valid token provided
 */
const optionalAuth = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = decoded;
            } catch (error) {
                // Invalid token, but continue without user
                req.user = null;
            }
        } else {
            req.user = null;
        }
        
        next();
    } catch (error) {
        next();
    }
};

module.exports = {
    authenticate,
    optionalAuth
};
