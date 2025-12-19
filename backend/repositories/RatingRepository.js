const { supabase } = require('../config/database');

class RatingRepository {
    /**
     * Create or update a rating
     */
    async upsert(ratingData) {
        const { content_id, user_id, user_identifier, rating } = ratingData;

        // Use the database function for upsert
        const { data, error } = await supabase.rpc('upsert_rating', {
            p_content_id: content_id,
            p_user_id: user_id || null,
            p_user_identifier: user_identifier || null,
            p_rating: rating
        });

        if (error) throw error;
        return data[0]; // Returns { success, message, rating_id, average_rating, rating_count }
    }

    /**
     * Get user's rating for a content
     */
    async findUserRating(contentId, userId, userIdentifier) {
        const { data, error } = await supabase.rpc('get_user_rating', {
            p_content_id: contentId,
            p_user_id: userId || null,
            p_user_identifier: userIdentifier || null
        });

        if (error) throw error;
        return data[0]?.rating || null;
    }

    /**
     * Get rating statistics for a content
     */
    async getStats(contentId) {
        const { data, error } = await supabase.rpc('get_content_rating_stats', {
            p_content_id: contentId
        });

        if (error) throw error;
        return data[0] || { average_rating: 0, rating_count: 0 };
    }

    /**
     * Get all ratings for a content (for admin/analytics)
     */
    async findByContentId(contentId) {
        const { data, error } = await supabase
            .from('ratings')
            .select(`
                *,
                user:users(id, username, full_name, profile_picture_url)
            `)
            .eq('content_id', contentId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    /**
     * Get all ratings by a user
     */
    async findByUserId(userId) {
        const { data, error } = await supabase
            .from('ratings')
            .select(`
                *,
                content:content(id, title, slug, cover_image_url)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    /**
     * Delete a rating
     */
    async delete(ratingId) {
        const { error } = await supabase
            .from('ratings')
            .delete()
            .eq('id', ratingId);

        if (error) throw error;
        return true;
    }

    /**
     * Check if user has rated content
     */
    async hasUserRated(contentId, userId, userIdentifier) {
        let query = supabase
            .from('ratings')
            .select('id')
            .eq('content_id', contentId);

        if (userId) {
            query = query.eq('user_id', userId);
        } else if (userIdentifier) {
            query = query.eq('user_identifier', userIdentifier);
        } else {
            return false;
        }

        const { data, error } = await query;

        if (error) throw error;
        return data && data.length > 0;
    }
}

module.exports = new RatingRepository();
