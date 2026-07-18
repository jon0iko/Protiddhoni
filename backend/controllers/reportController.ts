import type { Request, Response } from 'express';
import ReportRepository from '../repositories/ReportRepository';
import ContentRepository from '../repositories/ContentRepository';
import AdminActionLogRepository from '../repositories/AdminActionLogRepository';
import NotificationService from '../services/notificationService';
import cacheManager from '../services/cacheManager';

const CONTENT_LIST_CACHE_PREFIX = 'content:list:';
const invalidateContentLists = () => cacheManager.deleteByPrefix(CONTENT_LIST_CACHE_PREFIX);

export const createReport = async (req: Request, res: Response) => {
    try {
        const { content_id, reason_category, reason_details } = req.body;

        if (!content_id || !reason_category) {
            return res.status(400).json({
                success: false,
                error: 'Content ID and reason category are required'
            });
        }

        const content = await ContentRepository.findById(content_id);
        if (!content || !content.is_published) {
            return res.status(404).json({
                success: false,
                error: 'Content not found or not published'
            });
        }

        // Prevent duplicate pending report from the same user for the same content
        const existingReport = await ReportRepository.checkPendingByUser(req.user.id, content_id);
        if (existingReport) {
            return res.status(400).json({
                success: false,
                error: 'আপনি ইতিমধ্যে এই লেখার বিরুদ্ধে অভিযোগ করেছেন। অ্যাডমিন পর্যালোচনা করছেন।'
            });
        }

        const report = await ReportRepository.create({
            reporter_id: req.user.id,
            content_id,
            reason_category,
            reason_details: reason_details || null
        });

        res.status(201).json({
            success: true,
            data: report,
            message: 'আপনার অভিযোগ জমা দেওয়া হয়েছে। অ্যাডমিন প্যানেল এটি পর্যালোচনা করবে।'
        });
    } catch (error: any) {
        console.error('Create report error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getPendingReports = async (req: Request, res: Response) => {
    try {
        const reportedContents = await ReportRepository.findPendingGroupedByContent();
        res.json({
            success: true,
            data: reportedContents,
            count: reportedContents.length
        });
    } catch (error: any) {
        console.error('Get pending reports error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const resolveReports = async (req: Request, res: Response) => {
    try {
        const { content_id, action, reason } = req.body;

        if (!content_id || !action || !['takedown', 'dismiss'].includes(action)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid action. Must be takedown or dismiss.'
            });
        }

        const content = await ContentRepository.findById(content_id);
        if (!content) {
            return res.status(404).json({
                success: false,
                error: 'Content not found'
            });
        }

        if (action === 'takedown') {
            // Unpublish content if currently published
            if (content.is_published) {
                const updated = await ContentRepository.update(content_id, {
                    is_published: false,
                    reviewed_by: req.user.id,
                    reviewed_at: new Date().toISOString()
                });

                invalidateContentLists();

                await AdminActionLogRepository.create({
                    admin_id: req.user.id,
                    action_type: 'unpublish',
                    content_id,
                    reason: reason || 'রিপোর্ট ও অভিযোগের ভিত্তিতে অ্যাডমিন দ্বারা অপসারিত',
                    metadata: {
                        title: content.title,
                        slug: content.slug,
                        author_id: content.author_id,
                        previous_status: content.status,
                        was_published: content.is_published,
                        published_at: content.published_at
                    }
                });

                await NotificationService.notifyContentUnpublished({
                    ...updated,
                    title: content.title,
                    author_id: content.author_id,
                    unpublish_reason: reason || 'রিপোর্ট ও অভিযোগের ভিত্তিতে অ্যাডমিন দ্বারা অপসারিত'
                });
            }

            // Mark reports resolved
            const resolvedReports = await ReportRepository.resolveByContentId(
                content_id,
                'resolved_takedown',
                req.user.id
            );

            return res.json({
                success: true,
                data: resolvedReports,
                message: 'লেখাটি অপসারণ করা হয়েছে এবং অভিযোগগুলো নিষ্পত্তি করা হয়েছে'
            });
        } else {
            // Dismiss reports
            const resolvedReports = await ReportRepository.resolveByContentId(
                content_id,
                'dismissed',
                req.user.id
            );

            return res.json({
                success: true,
                data: resolvedReports,
                message: 'অভিযোগগুলো খারিজ করা হয়েছে'
            });
        }
    } catch (error: any) {
        console.error('Resolve reports error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
