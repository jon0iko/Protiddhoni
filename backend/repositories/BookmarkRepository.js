/**
 * Bookmark Repository
 * Handles bookmark-related database operations
 */

const db = require('../config/database');

class BookmarkRepository {
    async create(userId, contentId) {
        const { data, error } = await db.getClient()
            .from('bookmarks')
            .insert({ user_id: userId, content_id: contentId })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async findByUser(userId) {
        const { data, error } = await db.getClient()
            .from('bookmarks')
            .select(`
                *,
                content:content_id (
                    id,
                    title,
                    slug,
                    excerpt,
                    cover_image_url,
                    content_type,
                    view_count,
                    author:author_id (
                        id,
                        username,
                        full_name,
                        profile_picture_url
                    ),
                    category:category_id (
                        id,
                        name,
                        slug
                    )
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    }

    async findByUserAndContent(userId, contentId) {
        const { data, error } = await db.getClient()
            .from('bookmarks')
            .select('*')
            .eq('user_id', userId)
            .eq('content_id', contentId)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
        return data;
    }

    async delete(userId, contentId) {
        const { error } = await db.getClient()
            .from('bookmarks')
            .delete()
            .eq('user_id', userId)
            .eq('content_id', contentId);
        
        if (error) throw error;
        return true;
    }

    async deleteById(id) {
        const { error } = await db.getClient()
            .from('bookmarks')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    }
}

module.exports = new BookmarkRepository();
