/**
 * Content Controller
 * Handles content CRUD, submission, approval/rejection
 */

const ContentRepository = require('../repositories/ContentRepository');
const UserRepository = require('../repositories/UserRepository');
const AdminActionLogRepository = require('../repositories/AdminActionLogRepository');
const NotificationService = require('../services/notificationService');
const slugify = require('../utils/slugify');
const { updateSlugFromTitle } = require('../utils/slugify');
const ContentQueryBuilder = require('../utils/ContentQueryBuilder');
const { ContentAccess, PaywallDecorator } = require('../middleware/contentAccessDecorator');
const db = require('../config/database');
const crypto = require('crypto');

const getViewerKey = (req) => {
    if (req.user?.id) {
        return `u:${req.user.id}`;
    }

    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.ip || 'unknown-ip';
    const userAgent = req.get('user-agent') || 'unknown-ua';
    const raw = `${ip}|${userAgent}`;
    const hash = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
    return `a:${hash}`;
};

exports.advancedSearch = async (req, res) => {
    try {
        const builder = new ContentQueryBuilder();

        // Text search accepts q, query, or search for compatibility with both the
        // navbar suggestion bar (`q`) and the filter sidebar (`query`).
        const searchText = req.query.q || req.query.query || req.query.search;

        builder
            .setSearchText(searchText)
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

        // Increment view count with session dedupe
        const sessionHeader = req.headers['x-client-session-id'];
        const sessionKey = Array.isArray(sessionHeader) ? sessionHeader[0] : sessionHeader;
        const viewerKey = getViewerKey(req);
        const effectiveSessionKey = sessionKey || `fallback:${viewerKey}`;

        const counted = await ContentRepository.incrementViewCountWithSession(
            req.params.id,
            effectiveSessionKey,
            viewerKey
        );

        console.log('[ViewCount] getById increment decision:', {
            contentId: req.params.id,
            sessionKeyPreview: effectiveSessionKey.slice(0, 12),
            viewerKeyPreview: viewerKey.slice(0, 12),
            counted: counted === true
        });

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
        const slugOrId = req.params.slug;
        let content = null;
        
        // First try to find by slug
        content = await ContentRepository.findBySlug(slugOrId);
        
        // If not found by slug, try by ID (for cases where slug is empty or ID is passed)
        if (!content) {
            content = await ContentRepository.findById(slugOrId);
        }
        
        if (!content) {
            return res.status(404).json({ success: false, error: 'Content not found' });
        }

        // Allow access if: 1) Content is published, OR 2) User is the author, OR 3) User is admin
        const isAuthor = req.user && req.user.id === content.author_id;
        const isAdmin = req.user && req.user.is_admin;
        
        if (!content.is_published && !isAuthor && !isAdmin) {
            console.log('Access denied:', {
                is_published: content.is_published,
                has_user: !!req.user,
                user_id: req.user?.id,
                author_id: content.author_id,
                is_author: isAuthor,
                is_admin: isAdmin
            });
            return res.status(403).json({ success: false, error: 'Content not accessible' });
        }

        // Check paywall access using Decorator Pattern
        const baseAccess = new ContentAccess();
        const paywallAccess = new PaywallDecorator(baseAccess, db);
        
        const accessCheck = await paywallAccess.checkAccess(req.user, content.id);
        
        if (!accessCheck.granted) {
            // Premium content blocked by paywall
            return res.status(403).json({ 
                success: false, 
                error: accessCheck.message,
                reason: accessCheck.reason,
                requiresPayment: accessCheck.requiresPayment,
                contentDetails: accessCheck.contentDetails,
                isPremiumBlocked: true
            });
        }

        // Increment view count for published content only
        if (content.is_published) {
            const sessionHeader = req.headers['x-client-session-id'];
            const sessionKey = Array.isArray(sessionHeader) ? sessionHeader[0] : sessionHeader;
            const viewerKey = getViewerKey(req);
            const effectiveSessionKey = sessionKey || `fallback:${viewerKey}`;

            const counted = await ContentRepository.incrementViewCountWithSession(
                content.id,
                effectiveSessionKey,
                viewerKey
            );

            console.log('[ViewCount] getBySlug increment decision:', {
                slug: slugOrId,
                contentId: content.id,
                sessionKeyPreview: effectiveSessionKey.slice(0, 12),
                viewerKeyPreview: viewerKey.slice(0, 12),
                counted: counted === true
            });
        }

        // Get review stats
        const stats = await ContentRepository.getStats(content.id);
        content.stats = stats;

        // Attach isFollowing for the author so the reader UI can show the
        // correct Follow/Following state. The content route uses optionalAuth.
        if (req.user && content.author && req.user.id !== content.author.id) {
            content.author.isFollowing = await UserRepository.isFollowing(
                req.user.id,
                content.author.id
            );
        } else if (content.author) {
            content.author.isFollowing = false;
        }

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
        
        // Update slug if title changed or if slug is empty
        if (req.body.title && (req.body.title !== existingContent.title || !existingContent.slug)) {
            updates.slug = updateSlugFromTitle(existingContent.slug, req.body.title);
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

        // Log admin action
        await AdminActionLogRepository.create({
            admin_id: req.user.id,
            action_type: 'approve',
            content_id: req.params.id,
            metadata: {
                title: content.title,
                slug: content.slug,
                author_id: content.author_id,
                previous_status: content.status
            }
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

        // Log admin action
        await AdminActionLogRepository.create({
            admin_id: req.user.id,
            action_type: 'reject',
            content_id: req.params.id,
            reason: reason,
            metadata: {
                title: content.title,
                slug: content.slug,
                author_id: content.author_id,
                previous_status: content.status
            }
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

exports.unpublish = async (req, res) => {
    try {
        const { reason } = req.body;

        const content = await ContentRepository.findById(req.params.id);

        if (!content) {
            return res.status(404).json({ success: false, error: 'Content not found' });
        }

        if (!content.is_published || content.status !== 'approved') {
            return res.status(400).json({
                success: false,
                error: 'Only published and approved content can be unpublished'
            });
        }

        const updated = await ContentRepository.update(req.params.id, {
            is_published: false,
            reviewed_by: req.user.id,
            reviewed_at: new Date().toISOString()
        });

        // Log admin action
        await AdminActionLogRepository.create({
            admin_id: req.user.id,
            action_type: 'unpublish',
            content_id: req.params.id,
            reason: reason || null,
            metadata: {
                title: content.title,
                slug: content.slug,
                author_id: content.author_id,
                previous_status: content.status,
                was_published: content.is_published,
                published_at: content.published_at
            }
        });

        // Notify author
        await NotificationService.notifyContentUnpublished({
            ...updated,
            title: content.title,
            author_id: content.author_id,
            unpublish_reason: reason || null
        });

        res.json({
            success: true,
            data: updated,
            message: 'লেখা অপ্রকাশিত করা হয়েছে'
        });
    } catch (error) {
        console.error('Unpublish content error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.republish = async (req, res) => {
    try {
        const content = await ContentRepository.findById(req.params.id);

        if (!content) {
            return res.status(404).json({ success: false, error: 'Content not found' });
        }

        // Only allow republishing content that was unpublished (status=approved, is_published=false)
        if (content.status !== 'approved' || content.is_published) {
            return res.status(400).json({
                success: false,
                error: 'Only unpublished content (with approved status) can be republished'
            });
        }

        // Find and mark the active unpublish log entry as reverted
        const unpublishLog = await AdminActionLogRepository.findActiveUnpublish(req.params.id);
        if (unpublishLog) {
            await AdminActionLogRepository.markReverted(unpublishLog.id, req.user.id);
        }

        const updated = await ContentRepository.update(req.params.id, {
            is_published: true,
            published_at: new Date().toISOString(),
            reviewed_by: req.user.id,
            reviewed_at: new Date().toISOString()
        });

        // Log admin action
        await AdminActionLogRepository.create({
            admin_id: req.user.id,
            action_type: 'republish',
            content_id: req.params.id,
            metadata: {
                title: content.title,
                slug: content.slug,
                author_id: content.author_id,
                previous_status: content.status,
                was_published: content.is_published,
                reverted_unpublish_log_id: unpublishLog?.id || null
            }
        });

        // Notify author
        await NotificationService.notifyContentRepublished({
            ...updated,
            title: content.title,
            author_id: content.author_id
        });

        res.json({
            success: true,
            data: updated,
            message: 'লেখা পুনরায় প্রকাশিত হয়েছে'
        });
    } catch (error) {
        console.error('Republish content error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getAdminActionHistory = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const result = await AdminActionLogRepository.findAll({ page, limit });

        res.json({
            success: true,
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Get admin action history error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
