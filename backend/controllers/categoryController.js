/**
 * Category Controller
 * Handles category operations
 */

const CategoryRepository = require('../repositories/CategoryRepository');
const ContentRepository = require('../repositories/ContentRepository');

exports.getAll = async (req, res) => {
    try {
        const categories = await CategoryRepository.findAll();
        
        // Optionally include content count for each category
        if (req.query.includeCount === 'true') {
            for (const category of categories) {
                category.contentCount = await CategoryRepository.getContentCount(category.id);
            }
        }

        res.json({ success: true, data: categories, count: categories.length });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getBySlug = async (req, res) => {
    try {
        const category = await CategoryRepository.findBySlug(req.params.slug);
        
        if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }

        // Get content count
        category.contentCount = await CategoryRepository.getContentCount(category.id);

        res.json({ success: true, data: category });
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getContent = async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;
        const contents = await ContentRepository.findByCategory(req.params.slug, limit);
        
        res.json({ success: true, data: contents, count: contents.length });
    } catch (error) {
        console.error('Get category content error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
