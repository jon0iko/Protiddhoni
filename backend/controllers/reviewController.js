/**
 * Review Controller
 * Handles content reviews and ratings
 */

const ReviewRepository = require('../repositories/ReviewRepository');

exports.create = async (req, res) => {
    try {
        // TODO: Create a review
        res.status(201).json({ message: 'Review created' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getByContentId = async (req, res) => {
    try {
        // TODO: Get reviews for a content
        res.json({ reviews: [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        // TODO: Update a review
        res.json({ message: 'Review updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        // TODO: Delete a review
        res.json({ message: 'Review deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
