/**
 * Review Controller
 * Handles content reviews and ratings
 */

const ReviewRepository = require('../repositories/ReviewRepository');
const ContentRepository = require('../repositories/ContentRepository');

exports.create = async (req, res) => {
    try {
        const { content_id, rating, review_text } = req.body;

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

        // Check if content exists
        const content = await ContentRepository.findById(content_id);
        if (!content) {
            return res.status(404).json({ success: false, error: 'Content not found' });
        }

        // Check if user already reviewed this content
        const existingReview = await ReviewRepository.findUserReviewForContent(
            req.user.id, 
            content_id
        );
        
        if (existingReview) {
            return res.status(400).json({ 
                success: false, 
                error: 'You have already reviewed this content' 
            });
        }

        const reviewData = {
            content_id,
            user_id: req.user.id,
            rating,
            review_text: review_text || null
        };

        const review = await ReviewRepository.create(reviewData);
        res.status(201).json({ success: true, data: review });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getByContentId = async (req, res) => {
    try {
        const reviews = await ReviewRepository.findByContentId(req.params.contentId);
        const stats = await ReviewRepository.getAverageRating(req.params.contentId);
        
        res.json({ 
            success: true, 
            data: reviews, 
            count: reviews.length,
            stats 
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getByUserId = async (req, res) => {
    try {
        const reviews = await ReviewRepository.findByUserId(req.params.userId);
        res.json({ success: true, data: reviews, count: reviews.length });
    } catch (error) {
        console.error('Get user reviews error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const review = await ReviewRepository.findById(req.params.id);
        
        if (!review) {
            return res.status(404).json({ success: false, error: 'Review not found' });
        }

        // Only review owner can update
        if (review.user_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        const { rating, review_text } = req.body;
        const updates = {};
        
        if (rating !== undefined) {
            if (rating < 1 || rating > 5) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Rating must be between 1 and 5' 
                });
            }
            updates.rating = rating;
        }
        
        if (review_text !== undefined) {
            updates.review_text = review_text;
        }

        const updated = await ReviewRepository.update(req.params.id, updates);
        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const review = await ReviewRepository.findById(req.params.id);
        
        if (!review) {
            return res.status(404).json({ success: false, error: 'Review not found' });
        }

        // Only review owner or admin can delete
        if (review.user_id !== req.user.id && !req.user.is_admin) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        await ReviewRepository.delete(req.params.id);
        res.json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
