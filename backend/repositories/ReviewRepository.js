/**
 * Design Pattern: Repository
 * Abstract data access layer for reviews
 */

const db = require('../config/database');

class ReviewRepository {
    async create(reviewData) {
        const { data, error } = await db.getClient()
            .from('reviews')
            .insert(reviewData)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async findByContentId(contentId) {
        const { data, error } = await db.getClient()
            .from('reviews')
            .select(`
                *,
                user:user_id (id, username, full_name, profile_picture_url)
            `)
            .eq('content_id', contentId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    }

    async findByUserId(userId) {
        const { data, error } = await db.getClient()
            .from('reviews')
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
            .from('reviews')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) return null;
        return data;
    }

    async findUserReviewForContent(userId, contentId) {
        const { data, error } = await db.getClient()
            .from('reviews')
            .select('*')
            .eq('user_id', userId)
            .eq('content_id', contentId)
            .single();
        
        if (error) return null;
        return data;
    }

    async update(id, updates) {
        const { data, error } = await db.getClient()
            .from('reviews')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async delete(id) {
        const { error } = await db.getClient()
            .from('reviews')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    }

    async getAverageRating(contentId) {
        const { data, error } = await db.getClient()
            .from('reviews')
            .select('rating')
            .eq('content_id', contentId);
        
        if (error) throw error;
        
        if (data.length === 0) return { average: 0, count: 0 };
        
        const sum = data.reduce((acc, review) => acc + review.rating, 0);
        return {
            average: Math.round((sum / data.length) * 10) / 10,
            count: data.length
        };
    }
}

module.exports = new ReviewRepository();
