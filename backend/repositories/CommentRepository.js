/**
 * Design Pattern: Repository
 * Abstract data access layer for comments
 */

const db = require('../config/database');

class CommentRepository {
    async create(commentData) {
        const { data, error } = await db.getClient()
            .from('comments')
            .insert(commentData)
            .select(`
                *,
                user:user_id (id, username, full_name, profile_picture_url)
            `)
            .single();
        
        if (error) throw error;
        return data;
    }

    async findByContentId(contentId) {
        const { data, error } = await db.getClient()
            .from('comments')
            .select(`
                *,
                user:user_id (id, username, full_name, profile_picture_url),
                replies:comments!parent_comment_id (
                    *,
                    user:user_id (id, username, full_name, profile_picture_url)
                )
            `)
            .eq('content_id', contentId)
            .is('parent_comment_id', null) // Only get top-level comments
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Sort replies by created_at ascending
        if (data) {
            data.forEach(comment => {
                if (comment.replies) {
                    comment.replies.sort((a, b) => 
                        new Date(a.created_at) - new Date(b.created_at)
                    );
                }
            });
        }
        
        return data;
    }

    async findByUserId(userId) {
        const { data, error } = await db.getClient()
            .from('comments')
            .select(`
                *,
                content:content_id (id, title, slug)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    }

    async findById(id) {
        const { data, error } = await db.getClient()
            .from('comments')
            .select(`
                *,
                user:user_id (id, username, full_name, profile_picture_url)
            `)
            .eq('id', id)
            .single();
        
        if (error) return null;
        return data;
    }

    async findReplies(parentCommentId) {
        const { data, error } = await db.getClient()
            .from('comments')
            .select(`
                *,
                user:user_id (id, username, full_name, profile_picture_url)
            `)
            .eq('parent_comment_id', parentCommentId)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        return data;
    }

    async update(id, updates) {
        const updateData = {
            ...updates,
            is_edited: true,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await db.getClient()
            .from('comments')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                user:user_id (id, username, full_name, profile_picture_url)
            `)
            .single();
        
        if (error) throw error;
        return data;
    }

    async delete(id) {
        const { error } = await db.getClient()
            .from('comments')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    }

    async getCommentCount(contentId) {
        const { count, error} = await db.getClient()
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('content_id', contentId);
        
        if (error) throw error;
        return count || 0;
    }
}

module.exports = new CommentRepository();
