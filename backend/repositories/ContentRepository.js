/**
 * Design Pattern: Repository
 */

const db = require('../config/database');

class ContentRepository {
    async create(contentData) {
        // TODO: Implement content creation
        const { data, error } = await db.getClient()
            .from('content')
            .insert(contentData)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async findById(id) {
        // TODO: Implement with joins for author, category, series
        const { data, error } = await db.getClient()
            .from('content')
            .select(`
                *,
                users:author_id (username, full_name, profile_picture_url),
                categories:category_id (name, slug),
                series:series_id (title, slug)
            `)
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    }

    async findBySlug(slug) {
        // TODO: Implement find by slug
        return null;
    }

    async findPublished(filters = {}) {
        // TODO: Implement with filtering
        let query = db.getClient()
            .from('content')
            .select('*')
            .eq('is_published', true)
            .eq('status', 'approved');

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    async findPending() {
        // TODO: Implement find pending for admin
        const { data, error } = await db.getClient()
            .from('content')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        return data;
    }

    async update(id, updates) {
        // TODO: Implement update
        const { data, error } = await db.getClient()
            .from('content')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async delete(id) {
        // TODO: Implement delete
        const { error } = await db.getClient()
            .from('content')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    }
}

module.exports = new ContentRepository();
