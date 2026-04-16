/**
 * Series Controller
 * Handles series CRUD and chapter management
 */

const SeriesRepository = require('../repositories/SeriesRepository');
const ContentRepository = require('../repositories/ContentRepository');
const slugify = require('../utils/slugify');
const { updateSlugFromTitle } = require('../utils/slugify');

exports.create = async (req, res) => {
    try {
        const seriesData = {
            ...req.body,
            author_id: req.user.id,
            slug: slugify(req.body.title),
            total_chapters: 0,
            is_completed: false
        };

        const series = await SeriesRepository.create(seriesData);
        res.status(201).json({ success: true, data: series });
    } catch (error) {
        console.error('Create series error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const series = await SeriesRepository.findById(req.params.id);
        
        if (!series) {
            return res.status(404).json({ success: false, error: 'Series not found' });
        }

        res.json({ success: true, data: series });
    } catch (error) {
        console.error('Get series error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getBySlug = async (req, res) => {
    try {
        const series = await SeriesRepository.findBySlug(req.params.slug);
        
        if (!series) {
            return res.status(404).json({ success: false, error: 'Series not found' });
        }

        res.json({ success: true, data: series });
    } catch (error) {
        console.error('Get series by slug error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getPublished = async (req, res) => {
    try {
        const usePagination = req.query.page || req.query.paginated === 'true';

        if (usePagination) {
            const filters = {
                category_id: req.query.category_id,
                author_id: req.query.author_id,
                sort_by: req.query.sort_by,
                order: req.query.order,
                page: req.query.page,
                limit: req.query.limit
            };

            const result = await SeriesRepository.findPublishedPaginated(filters);
            res.json({ 
                success: true, 
                data: result.data, 
                pagination: result.pagination
            });
        } else {
            const filters = {
                category_id: req.query.category_id,
                author_id: req.query.author_id,
                limit: req.query.limit ? parseInt(req.query.limit) : undefined
            };

            const series = await SeriesRepository.findPublished(filters);
            res.json({ success: true, data: series, count: series.length });
        }
    } catch (error) {
        console.error('Get published series error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getChapters = async (req, res) => {
    try {
        const chapters = await SeriesRepository.getChapters(req.params.seriesId);
        res.json({ success: true, data: chapters, count: chapters.length });
    } catch (error) {
        console.error('Get series chapters error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getByAuthor = async (req, res) => {
    try {
        const series = await SeriesRepository.findByAuthor(req.params.authorId);
        res.json({ success: true, data: series, count: series.length });
    } catch (error) {
        console.error('Get series by author error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        // Verify ownership
        const series = await SeriesRepository.findById(req.params.id);
        if (!series) {
            return res.status(404).json({ success: false, error: 'Series not found' });
        }
        if (series.author_id !== req.user.id && !req.user.is_admin) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        const updates = { ...req.body };
        if (req.body.title) {
            updates.slug = updateSlugFromTitle(series.slug, req.body.title);
        }

        const updatedSeries = await SeriesRepository.update(req.params.id, updates);
        res.json({ success: true, data: updatedSeries });
    } catch (error) {
        console.error('Update series error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        // Verify ownership
        const series = await SeriesRepository.findById(req.params.id);
        if (!series) {
            return res.status(404).json({ success: false, error: 'Series not found' });
        }
        if (series.author_id !== req.user.id && !req.user.is_admin) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        await SeriesRepository.delete(req.params.id);
        res.json({ success: true, message: 'Series deleted successfully' });
    } catch (error) {
        console.error('Delete series error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
