/**
 * Category Controller
 * Handles category operations
 */

const CategoryRepository = require('../repositories/CategoryRepository');
const ContentRepository = require('../repositories/ContentRepository');
const slugify = require('../utils/slugify');

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

exports.create = async (req, res) => {
    try {
        const { name, description, icon } = req.body;

        // Validation
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Category name is required' });
        }

        if (name.length > 100) {
            return res.status(400).json({ success: false, error: 'Category name must be 100 characters or less' });
        }

        // Generate slug from name
        const slug = slugify(name);

        // Check if slug already exists
        const existing = await CategoryRepository.findBySlug(slug);
        if (existing) {
            return res.status(409).json({ success: false, error: 'A category with this name already exists' });
        }

        // Create category
        const categoryData = {
            name: name.trim(),
            slug,
            description: description?.trim() || null,
            icon: icon?.trim() || null,
        };

        const category = await CategoryRepository.create(categoryData);
        
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if category exists
        const category = await CategoryRepository.findById(id);
        if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }

        // Check if category has content
        const contentCount = await CategoryRepository.getContentCount(id);
        if (contentCount > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Cannot delete category with existing content' 
            });
        }

        // Delete category
        await CategoryRepository.delete(id);
        
        res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
