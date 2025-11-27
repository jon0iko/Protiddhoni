/**
 * User Controller
 * Handles user profile, follow/unfollow
 */

const UserRepository = require('../repositories/UserRepository');
const ContentRepository = require('../repositories/ContentRepository');

exports.getProfile = async (req, res) => {
    try {
        const user = await UserRepository.findByUsername(req.params.username);
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Get user stats
        const stats = await UserRepository.getUserStats(user.id);
        user.stats = stats;

        // Check if current user is following this user
        if (req.user) {
            user.isFollowing = await UserRepository.isFollowing(req.user.id, user.id);
        }

        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
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

exports.follow = async (req, res) => {
    try {
        const { userId } = req.params;

        if (req.user.id === userId) {
            return res.status(400).json({ success: false, error: 'Cannot follow yourself' });
        }

        const targetUser = await UserRepository.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Check if already following
        const isFollowing = await UserRepository.isFollowing(req.user.id, userId);
        if (isFollowing) {
            return res.status(400).json({ success: false, error: 'Already following this user' });
        }

        await UserRepository.follow(req.user.id, userId);
        res.json({ success: true, message: 'Followed successfully' });
    } catch (error) {
        console.error('Follow error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.unfollow = async (req, res) => {
    try {
        const { userId } = req.params;

        await UserRepository.unfollow(req.user.id, userId);
        res.json({ success: true, message: 'Unfollowed successfully' });
    } catch (error) {
        console.error('Unfollow error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getFollowers = async (req, res) => {
    try {
        const followers = await UserRepository.getFollowers(req.params.userId);
        res.json({ success: true, data: followers, count: followers.length });
    } catch (error) {
        console.error('Get followers error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getFollowing = async (req, res) => {
    try {
        const following = await UserRepository.getFollowing(req.params.userId);
        res.json({ success: true, data: following, count: following.length });
    } catch (error) {
        console.error('Get following error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getContent = async (req, res) => {
    try {
        const contents = await ContentRepository.findByAuthor(req.params.userId);
        res.json({ success: true, data: contents, count: contents.length });
    } catch (error) {
        console.error('Get user content error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getFollowing = async (req, res) => {
    try {
        // TODO: Get users this user is following
        res.json({ following: [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
