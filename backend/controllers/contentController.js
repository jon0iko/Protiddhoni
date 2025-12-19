/**
 * Content Controller
 * Handles content CRUD, submission, approval/rejection
 */

const ContentRepository = require('../repositories/ContentRepository');
const NotificationService = require('../services/notificationService');
const slugify = require('../utils/slugify');
const ContentQueryBuilder = require('../utils/ContentQueryBuilder');

exports.advancedSearch = async (req, res) => {
    try {
        const builder = new ContentQueryBuilder();
        
        // Build query from request parameters
        builder
            .setCategory(req.query.category)
            .setContentType(req.query.type)
            .setAuthor(req.query.author)
            .setSeries(req.query.series)
            .setRating(req.query.rating)
            .setStatus(req.query.status)
            .setIsPremium(req.query.is_premium)
            .setSort(req.query.sort_by, req.query.order)
            .setPagination(req.query.page, req.query.limit);

        const queryParams = builder.build();
        const result = await ContentRepository.findAdvanced(queryParams);

        res.json({ 
            success: true, 
            data: result.data, 
            count: result.count,
            page: queryParams.pagination.page,
            limit: queryParams.pagination.limit
        });
    } catch (error) {
        console.error('Advanced search error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const contentData = {
            ...req.body,
            author_id: req.user.id,
            slug: slugify(req.body.title),
            status: 'draft',
            is_published: false
        };

        const content = await ContentRepository.create(contentData);
        res.status(201).json({ success: true, data: content });
    } catch (error) {
        console.error('Create content error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const content = await ContentRepository.findById(req.params.id);
        
        if (!content) {
            return res.status(404).json({ success: false, error: 'Content not found' });
        }

        // Increment view count
        await ContentRepository.incrementViewCount(req.params.id);

        // Get review stats
        const stats = await ContentRepository.getStats(req.params.id);
        content.stats = stats;

        res.json({ success: true, data: content });
    } catch (error) {
        console.error('Get content error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getBySlug = async (req, res) => {
    try {
        const content = await ContentRepository.findBySlug(req.params.slug);
        
        if (!content) {
            return res.status(404).json({ success: false, error: 'Content not found' });
        }

        // Only show published content to non-authors
        if (!content.is_published && (!req.user || req.user.id !== content.author_id)) {
            return res.status(403).json({ success: false, error: 'Content not accessible' });
        }

        // Increment view count for published content
        if (content.is_published) {
            await ContentRepository.incrementViewCount(content.id);
        }

        // Get review stats
        const stats = await ContentRepository.getStats(content.id);
        content.stats = stats;

        res.json({ success: true, data: content });
    } catch (error) {
        console.error('Get content by slug error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getPublished = async (req, res) => {
    try {
        // Check if pagination parameters are present
        const usePagination = req.query.page || req.query.paginated === 'true';

        if (usePagination) {
            // Use new paginated endpoint
            const filters = {
                category_id: req.query.category_id,
                content_type: req.query.content_type,
                author_id: req.query.author_id,
                series_id: req.query.series_id,
                is_premium: req.query.is_premium !== undefined ? req.query.is_premium === 'true' : undefined,
                sort_by: req.query.sort_by,
                order: req.query.order,
                page: req.query.page,
                limit: req.query.limit
            };

            const result = await ContentRepository.findPublishedPaginated(filters);
            res.json({ 
                success: true, 
                data: result.data, 
                pagination: result.pagination
            });
        } else {
            // Use legacy endpoint for backward compatibility
            const filters = {
                category_id: req.query.category_id,
                content_type: req.query.content_type,
                author_id: req.query.author_id,
                series_id: req.query.series_id,
                is_premium: req.query.is_premium !== undefined ? req.query.is_premium === 'true' : undefined,
                limit: req.query.limit ? parseInt(req.query.limit) : undefined
            };

            const contents = await ContentRepository.findPublished(filters);
            res.json({ success: true, data: contents, count: contents.length });
        }
    } catch (error) {
        console.error('Get published content error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getByCategory = async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const contents = await ContentRepository.findByCategory(req.params.categorySlug, limit);
        res.json({ success: true, data: contents, count: contents.length });
    } catch (error) {
        console.error('Get content by category error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getByAuthor = async (req, res) => {
    try {
        const contents = await ContentRepository.findByAuthor(req.params.authorId);
        res.json({ success: true, data: contents, count: contents.length });
    } catch (error) {
        console.error('Get content by author error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getMyDrafts = async (req, res) => {
    try {
        const drafts = await ContentRepository.findDraftsByAuthor(req.user.id);
        res.json({ success: true, data: drafts, count: drafts.length });
    } catch (error) {
        console.error('Get drafts error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getPending = async (req, res) => {
    try {
        const contents = await ContentRepository.findPending();
        res.json({ success: true, data: contents, count: contents.length });
    } catch (error) {
        console.error('Get pending content error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        // Check if user owns the content
        const existingContent = await ContentRepository.findById(req.params.id);
        if (!existingContent) {
            return res.status(404).json({ success: false, error: 'Content not found' });
        }

        if (existingContent.author_id !== req.user.id && !req.user.is_admin) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        const updates = { ...req.body };
        
        // Update slug if title changed
        if (req.body.title && req.body.title !== existingContent.title) {
            updates.slug = slugify(req.body.title);
        }

        const content = await ContentRepository.update(req.params.id, updates);
        res.json({ success: true, data: content });
    } catch (error) {
        console.error('Update content error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        // Check if user owns the content
        const existingContent = await ContentRepository.findById(req.params.id);
        if (!existingContent) {
            return res.status(404).json({ success: false, error: 'Content not found' });
        }

        if (existingContent.author_id !== req.user.id && !req.user.is_admin) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        await ContentRepository.delete(req.params.id);
        res.json({ success: true, message: 'Content deleted successfully' });
    } catch (error) {
        console.error('Delete content error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.submitForReview = async (req, res) => {
    try {
        const content = await ContentRepository.findById(req.params.id);
        
        if (!content) {
            return res.status(404).json({ success: false, error: 'Content not found' });
        }

        if (content.author_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        if (content.status !== 'draft' && content.status !== 'rejected') {
            return res.status(400).json({ 
                success: false, 
                error: 'Content can only be submitted from draft or rejected status' 
            });
        }

        const updated = await ContentRepository.update(req.params.id, {
            status: 'pending',
            rejection_reason: null
        });

        // Notify admins (Observer pattern - would be implemented in NotificationService)
        // await NotificationService.notifyAdminsNewSubmission(updated);

        res.json({ 
            success: true, 
            data: updated,
            message: 'আপনার লেখা পর্যালোচনার জন্য জমা দেওয়া হয়েছে' 
        });
    } catch (error) {
        console.error('Submit for review error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.approve = async (req, res) => {
    try {
        const content = await ContentRepository.findById(req.params.id);
        
        if (!content) {
            return res.status(404).json({ success: false, error: 'Content not found' });
        }

        if (content.status !== 'pending') {
            return res.status(400).json({ 
                success: false, 
                error: 'Only pending content can be approved' 
            });
        }

        const updated = await ContentRepository.update(req.params.id, {
            status: 'approved',
            is_published: true,
            published_at: new Date().toISOString(),
            reviewed_by: req.user.id,
            reviewed_at: new Date().toISOString(),
            rejection_reason: null
        });

        // Notify author and followers (Observer pattern)
        await NotificationService.notifyContentApproved(updated);

        res.json({ 
            success: true, 
            data: updated,
            message: 'লেখা অনুমোদিত এবং প্রকাশিত হয়েছে' 
        });
    } catch (error) {
        console.error('Approve content error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.reject = async (req, res) => {
    try {
        const { reason } = req.body;
        
        if (!reason) {
            return res.status(400).json({ 
                success: false, 
                error: 'Rejection reason is required' 
            });
        }

        const content = await ContentRepository.findById(req.params.id);
        
        if (!content) {
            return res.status(404).json({ success: false, error: 'Content not found' });
        }

        if (content.status !== 'pending') {
            return res.status(400).json({ 
                success: false, 
                error: 'Only pending content can be rejected' 
            });
        }

        const updated = await ContentRepository.update(req.params.id, {
            status: 'rejected',
            is_published: false,
            rejection_reason: reason,
            reviewed_by: req.user.id,
            reviewed_at: new Date().toISOString()
        });

        // Notify author (Observer pattern)
        await NotificationService.notifyContentRejected(updated);

        res.json({ 
            success: true, 
            data: updated,
            message: 'লেখা প্রত্যাখ্যান করা হয়েছে' 
        });
    } catch (error) {
        console.error('Reject content error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
