import type { Request, Response, NextFunction } from 'express';
/**
 * Comment Controller
 * Handles content comments (ratings are now separate)
 */

import CommentRepository from '../repositories/CommentRepository';
import ContentRepository from '../repositories/ContentRepository';

export const create = async (req: Request, res: Response) => {
    try {
        const { content_id, comment_text, parent_comment_id } = req.body;

        if (!content_id || !comment_text) {
            return res.status(400).json({ 
                success: false, 
                error: 'Content ID and comment text are required' 
            });
        }

        // Check if content exists
        const content = await ContentRepository.findById(content_id);
        if (!content) {
            return res.status(404).json({ success: false, error: 'Content not found' });
        }

        // If it's a reply, check if parent comment exists
        if (parent_comment_id) {
            const parentComment = await CommentRepository.findById(parent_comment_id);
            if (!parentComment) {
                return res.status(404).json({ success: false, error: 'Parent comment not found' });
            }
        }

        const commentData = {
            content_id,
            user_id: req.user.id,
            comment_text,
            parent_comment_id: parent_comment_id || null
        };

        const comment = await CommentRepository.create(commentData);
        res.status(201).json({ success: true, data: comment });
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getByContentId = async (req: Request, res: Response) => {
    try {
        const comments = await CommentRepository.findByContentId(req.params.contentId);
        const totalComments = await CommentRepository.getCommentCount(req.params.contentId);
        
        res.json({ 
            success: true, 
            data: {
                comments,
                totalComments
            }
        });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getByUserId = async (req: Request, res: Response) => {
    try {
        const comments = await CommentRepository.findByUserId(req.params.userId);
        res.json({ success: true, data: comments, count: comments.length });
    } catch (error) {
        console.error('Get user comments error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getReplies = async (req: Request, res: Response) => {
    try {
        const replies = await CommentRepository.findReplies(req.params.commentId);
        res.json({ success: true, data: replies, count: replies.length });
    } catch (error) {
        console.error('Get replies error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const update = async (req: Request, res: Response) => {
    try {
        const comment = await CommentRepository.findById(req.params.id);
        
        if (!comment) {
            return res.status(404).json({ success: false, error: 'Comment not found' });
        }

        // Only comment owner can update
        if (comment.user_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        const { comment_text } = req.body;
        const updates: Record<string, any> = {};
        
        if (comment_text !== undefined) {
            if (!comment_text || comment_text.trim() === '') {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Comment text cannot be empty' 
                });
            }
            updates.comment_text = comment_text;
        }

        const updated = await CommentRepository.update(req.params.id, updates);
        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('Update comment error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const deleteHandler = async (req: Request, res: Response) => {
    try {
        const comment = await CommentRepository.findById(req.params.id);
        
        if (!comment) {
            return res.status(404).json({ success: false, error: 'Comment not found' });
        }

        // Only comment owner or admin can delete
        if (comment.user_id !== req.user.id && !req.user.is_admin) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        await CommentRepository.delete(req.params.id);
        res.json({ success: true, message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
export { deleteHandler as delete };
