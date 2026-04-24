/**
 * Like Controller
 * Handles like/favorite operations
 */

const LikeRepository = require('../repositories/LikeRepository');

exports.getMyLikes = async (req, res) => {
    try {
        const likes = await LikeRepository.findByUser(req.user.id);
        res.json({ success: true, data: likes, count: likes.length });
    } catch (error) {
        console.error('Get likes error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.addLike = async (req, res) => {
    try {
        const { contentId } = req.body;
        
        if (!contentId) {
            return res.status(400).json({ success: false, error: 'Content ID is required' });
        }

        // Check if already liked
        const existing = await LikeRepository.findByUserAndContent(req.user.id, contentId);
        if (existing) {
            return res.status(400).json({ success: false, error: 'Already liked' });
        }

        const like = await LikeRepository.create(req.user.id, contentId);
        res.status(201).json({ success: true, data: like });
    } catch (error) {
        console.error('Add like error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.removeLike = async (req, res) => {
    try {
        const { contentId } = req.params;
        
        await LikeRepository.delete(req.user.id, contentId);
        res.json({ success: true, message: 'Like removed successfully' });
    } catch (error) {
        console.error('Remove like error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.checkLike = async (req, res) => {
    try {
        const { contentId } = req.params;
        
        const like = await LikeRepository.findByUserAndContent(req.user.id, contentId);
        res.json({ success: true, isLiked: !!like });
    } catch (error) {
        console.error('Check like error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getLikeCount = async (req, res) => {
    try {
        const { contentId } = req.params;
        const count = await LikeRepository.countByContent(contentId);
        res.json({ success: true, count });
    } catch (error) {
        console.error('Get like count error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = exports;
