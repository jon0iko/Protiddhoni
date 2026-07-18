import type { Request, Response, NextFunction } from 'express';
/**
 * Content Controller
 * Handles content CRUD, submission, approval/rejection
 */

import ContentRepository from '../repositories/ContentRepository';
import UserRepository from '../repositories/UserRepository';
import AdminActionLogRepository from '../repositories/AdminActionLogRepository';
import NotificationService from '../services/notificationService';
import slugify from '../utils/slugify';
import { updateSlugFromTitle } from '../utils/slugify';
import ContentQueryBuilder from '../utils/ContentQueryBuilder';
import { ContentAccess, PaywallDecorator } from '../middleware/contentAccessDecorator';
import { isValidExternalUrl } from '../services/contentFactory';
import db from '../config/database';
import logger from '../config/logger';
import cacheManager from '../services/cacheManager';
import crypto from 'crypto';

// Namespace for cached public content-list responses. Any content mutation
// flushes this prefix so a newly published/edited/removed piece is reflected in
// list endpoints immediately (not after the TTL).
const CONTENT_LIST_CACHE_PREFIX = 'content:list:';
const invalidateContentLists = () => cacheManager.deleteByPrefix(CONTENT_LIST_CACHE_PREFIX);

// Fields an author (or admin) may change through PUT /api/content/:id.
// Deliberately excludes status, is_published, published_at, author_id, slug and
// every counter column — those are only mutated by the moderation endpoints.
const AUTHOR_EDITABLE_CONTENT_FIELDS = [
    'title',
    'body',
    'excerpt',
    'cover_image_url',
    'category_id',
    'is_premium',
    'price',
    // External-link posts keep their destination editable; without this an edit
    // to a link post would silently blank its URL.
    'external_url'
] as const;

// Audit rows store a short preview, never the full body — a long article would
// bloat every log row and the queue only needs enough to eyeball the change.
const LOG_BODY_PREVIEW_LENGTH = 280;
const truncateForLog = (body?: string | null) => {
    if (!body) return '';
    return body.length > LOG_BODY_PREVIEW_LENGTH
        ? `${body.slice(0, LOG_BODY_PREVIEW_LENGTH)}…`
        : body;
};

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

export const advancedSearch = async (req: Request, res: Response) => {
    try {
        const builder = new ContentQueryBuilder();

        // Text search accepts q, query, or search for compatibility with both the
        // navbar suggestion bar (`q`) and the filter sidebar (`query`).
        const searchText = req.query.q || req.query.query || req.query.search;

        const requestedSort = searchText
            ? req.query.sort_by || 'relevance'
            : req.query.sort_by === 'relevance' ? undefined : req.query.sort_by;

        builder
            .setSearchText(searchText)
            .setCategory(req.query.category)
            .setContentType(req.query.type)
            .setAuthor(req.query.author)
            .setSeries(req.query.series)
            .setRating(req.query.rating)
            .setStatus(req.query.status)
            .setIsPremium(req.query.is_premium)
            .setSort(requestedSort, req.query.order as string)
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

export const create = async (req: Request, res: Response) => {
    try {
        // An external_url is rendered as an <a href> on the content card, so a
        // javascript:/data: URL here would be stored XSS. Reject anything that
        // isn't an absolute http(s) URL. Client-side validation is not enough.
        if (req.body.external_url !== undefined && req.body.external_url !== null
            && !isValidExternalUrl(req.body.external_url)) {
            return res.status(400).json({
                success: false,
                error: 'External URL must be a valid http(s) link'
            });
        }

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

export const getById = async (req: Request, res: Response) => {
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

        logger.debug('[ViewCount] getById increment decision:', {
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

export const getBySlug = async (req: Request, res: Response) => {
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

            logger.debug('[ViewCount] getBySlug increment decision:', {
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

export const getPublished = async (req: Request, res: Response) => {
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

            // Public, non-personalized listing → cacheable. Short TTL plus
            // explicit invalidation on writes keeps it fresh.
            const cacheKey = `${CONTENT_LIST_CACHE_PREFIX}paginated:${JSON.stringify(filters)}`;
            const result = await cacheManager.getOrSet(cacheKey, 60,
                () => ContentRepository.findPublishedPaginated(filters));

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
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
            };

            const cacheKey = `${CONTENT_LIST_CACHE_PREFIX}legacy:${JSON.stringify(filters)}`;
            const contents = await cacheManager.getOrSet(cacheKey, 60,
                () => ContentRepository.findPublished(filters));

            res.json({ success: true, data: contents, count: contents.length });
        }
    } catch (error) {
        console.error('Get published content error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getByCategory = async (req: Request, res: Response) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        const contents = await ContentRepository.findByCategory(req.params.categorySlug, limit);
        res.json({ success: true, data: contents, count: contents.length });
    } catch (error) {
        console.error('Get content by category error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getByAuthor = async (req: Request, res: Response) => {
    try {
        const contents = await ContentRepository.findByAuthor(req.params.authorId);
        res.json({ success: true, data: contents, count: contents.length });
    } catch (error) {
        console.error('Get content by author error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getMyDrafts = async (req: Request, res: Response) => {
    try {
        const drafts = await ContentRepository.findDraftsByAuthor(req.user.id);
        res.json({ success: true, data: drafts, count: drafts.length });
    } catch (error) {
        console.error('Get drafts error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getPending = async (req: Request, res: Response) => {
    try {
        const contents = await ContentRepository.findPending();
        res.json({ success: true, data: contents, count: contents.length });
    } catch (error) {
        console.error('Get pending content error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const update = async (req: Request, res: Response) => {
    try {
        // Check if user owns the content
        const existingContent = await ContentRepository.findById(req.params.id);
        if (!existingContent) {
            return res.status(404).json({ success: false, error: 'Content not found' });
        }

        if (existingContent.author_id !== req.user.id && !req.user.is_admin) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        // SECURITY: never spread req.body straight into the update. This endpoint
        // is reachable by any authenticated author for their own content, so an
        // unfiltered spread lets a caller set moderation columns (status,
        // is_published, author_id, ...) and self-publish without review.
        // Anything outside this allowlist is dropped silently rather than 400'd
        // so existing callers that send extra fields keep working.
        const updates: Record<string, any> = {};
        for (const field of AUTHOR_EDITABLE_CONTENT_FIELDS) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updates[field] = req.body[field];
            }
        }

        // Same XSS guard as create — an edit must not be able to smuggle in a
        // javascript:/data: URL that create would have rejected.
        if (updates.external_url !== undefined && updates.external_url !== null
            && !isValidExternalUrl(updates.external_url)) {
            return res.status(400).json({
                success: false,
                error: 'External URL must be a valid http(s) link'
            });
        }

        // Update slug if title changed or if slug is empty
        if (updates.title && (updates.title !== existingContent.title || !existingContent.slug)) {
            updates.slug = updateSlugFromTitle(existingContent.slug, updates.title);
        }

        const content = await ContentRepository.update(req.params.id, updates);

        // MODERATION HOOK: an author silently rewriting an already-live article
        // bypasses review entirely, so record it for after-the-fact moderation.
        // Only for content that is actually live (draft/pending edits are normal
        // authoring), and only when the editor is the author — an admin editing
        // someone else's piece must not queue work for admins.
        if (
            existingContent.is_published === true &&
            existingContent.status === 'approved' &&
            existingContent.author_id === req.user.id
        ) {
            try {
                await AdminActionLogRepository.create({
                    admin_id: null, // author-initiated: there is no admin actor
                    action_type: 'edit',
                    content_id: existingContent.id,
                    reason: null,
                    metadata: {
                        edited_by: req.user.id,
                        slug: content?.slug || existingContent.slug,
                        before: {
                            title: existingContent.title || null,
                            excerpt: existingContent.excerpt || null,
                            body_length: (existingContent.body || '').length,
                            body_preview: truncateForLog(existingContent.body)
                        },
                        after: {
                            title: content?.title ?? existingContent.title ?? null,
                            excerpt: content?.excerpt ?? existingContent.excerpt ?? null,
                            body_length: (content?.body || '').length,
                            body_preview: truncateForLog(content?.body)
                        }
                    }
                });
            } catch (logError) {
                // Auditing must never break the author's edit.
                logger.error('Failed to log author edit for moderation', logError);
            }
        }

        invalidateContentLists();
        res.json({ success: true, data: content });
    } catch (error) {
        console.error('Update content error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const deleteHandler = async (req: Request, res: Response) => {
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
        invalidateContentLists();
        res.json({ success: true, message: 'Content deleted successfully' });
    } catch (error) {
        console.error('Delete content error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const submitForReview = async (req: Request, res: Response) => {
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

export const approve = async (req: Request, res: Response) => {
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

        // Freshly published content must appear in list endpoints immediately.
        invalidateContentLists();
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

export const reject = async (req: Request, res: Response) => {
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

        // A rejected piece is no longer published — flush any cached lists.
        invalidateContentLists();
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

export const unpublish = async (req: Request, res: Response) => {
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

        // Unpublished content must disappear from list endpoints immediately.
        invalidateContentLists();

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

export const republish = async (req: Request, res: Response) => {
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

        // Republished content must reappear in list endpoints immediately.
        invalidateContentLists();

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

export const getAdminActionHistory = async (req: Request, res: Response) => {
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

/**
 * Moderation queue: author edits to already-published articles that no admin
 * has triaged yet. Defaults to review_state='unchecked'.
 */
export const getEditQueue = async (req: Request, res: Response) => {
    try {
        const { page, limit, review_state: reviewState } = req.query;
        const result = await AdminActionLogRepository.findAll({
            page,
            limit,
            actionType: 'edit',
            reviewState: reviewState || 'unchecked'
        });

        res.json({
            success: true,
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Get edit queue error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Clear a moderation-queue item: mark the action log entry as checked.
 */
export const markActionChecked = async (req: Request, res: Response) => {
    try {
        const updated = await AdminActionLogRepository.markChecked(req.params.id, req.user.id);
        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('Mark action checked error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export { deleteHandler as delete };
