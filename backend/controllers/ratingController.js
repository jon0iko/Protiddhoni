const RatingRepository = require('../repositories/RatingRepository');
const crypto = require('crypto');

/**
 * Generate anonymous user identifier from IP and User-Agent
 */
const generateUserIdentifier = (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    return crypto.createHash('sha256').update(ip + userAgent).digest('hex');
};

/**
 * Submit or update a rating
 */
exports.submitRating = async (req, res) => {
    try {
        const { content_id, rating } = req.body;

        if (!content_id || !rating) {
            return res.status(400).json({
                success: false,
                error: 'Content ID and rating are required'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                error: 'Rating must be between 1 and 5'
            });
        }

        const userId = req.user?.id || null;
        const userIdentifier = userId ? null : generateUserIdentifier(req);

        const result = await RatingRepository.upsert({
            content_id,
            user_id: userId,
            user_identifier: userIdentifier,
            rating
        });

        if (result.success) {
            res.json({
                success: true,
                data: {
                    rating_id: result.rating_id,
                    average_rating: result.average_rating,
                    rating_count: result.rating_count
                },
                message: result.message
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.message
            });
        }
    } catch (error) {
        console.error('Error submitting rating:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit rating'
        });
    }
};

/**
 * Get rating statistics for a content
 */
exports.getRatingStats = async (req, res) => {
    try {
        const { contentId } = req.params;

        const stats = await RatingRepository.getStats(contentId);
        const userId = req.user?.id || null;
        const userIdentifier = userId ? null : generateUserIdentifier(req);

        // Get user's rating if exists
        const userRating = await RatingRepository.findUserRating(
            contentId,
            userId,
            userIdentifier
        );

        res.json({
            success: true,
            data: {
                average_rating: stats.average_rating || 0,
                rating_count: stats.rating_count || 0,
                user_rating: userRating
            }
        });
    } catch (error) {
        console.error('Error getting rating stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get rating statistics'
        });
    }
};

/**
 * Get user's rating for a content
 */
exports.getUserRating = async (req, res) => {
    try {
        const { contentId } = req.params;
        const userId = req.user?.id || null;
        const userIdentifier = userId ? null : generateUserIdentifier(req);

        const rating = await RatingRepository.findUserRating(
            contentId,
            userId,
            userIdentifier
        );

        res.json({
            success: true,
            data: { rating }
        });
    } catch (error) {
        console.error('Error getting user rating:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user rating'
        });
    }
};

/**
 * Get all ratings for a content (admin only)
 */
exports.getContentRatings = async (req, res) => {
    try {
        const { contentId } = req.params;

        const ratings = await RatingRepository.findByContentId(contentId);

        res.json({
            success: true,
            data: ratings,
            count: ratings.length
        });
    } catch (error) {
        console.error('Error getting content ratings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get content ratings'
        });
    }
};

/**
 * Get user's all ratings
 */
exports.getUserRatings = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const ratings = await RatingRepository.findByUserId(userId);

        res.json({
            success: true,
            data: ratings,
            count: ratings.length
        });
    } catch (error) {
        console.error('Error getting user ratings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user ratings'
        });
    }
};

/**
 * Delete a rating (admin only or own rating)
 */
exports.deleteRating = async (req, res) => {
    try {
        const { ratingId } = req.params;
        const userId = req.user?.id;

        // Check if user is admin or owns the rating
        const ratings = await RatingRepository.findByContentId(''); // Need to get the rating first
        const rating = ratings.find(r => r.id === ratingId);

        if (!rating) {
            return res.status(404).json({
                success: false,
                error: 'Rating not found'
            });
        }

        if (rating.user_id !== userId && !req.user?.is_admin) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized to delete this rating'
            });
        }

        await RatingRepository.delete(ratingId);

        res.json({
            success: true,
            message: 'Rating deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting rating:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete rating'
        });
    }
};
