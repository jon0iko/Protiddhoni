/**
 * Design Pattern: Repository
 * Abstract data access layer for series
 */

const db = require('../config/database');

class SeriesRepository {
    async create(seriesData) {
        const { data, error } = await db.getClient()
            .from('series')
            .insert(seriesData)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async findById(id) {
        const { data, error } = await db.getClient()
            .from('series')
            .select(`
                *,
                author:author_id (id, username, full_name, profile_picture_url),
                category:category_id (id, name, slug, icon)
            `)
            .eq('id', id)
            .single();
        
        if (error) return null;
        return data;
    }

    async findBySlug(slug) {
        const { data, error } = await db.getClient()
            .from('series')
            .select(`
                *,
                author:author_id (id, username, full_name, profile_picture_url),
                category:category_id (id, name, slug, icon)
            `)
            .eq('slug', slug)
            .single();
        
        if (error) return null;
        return data;
    }

    async findByAuthor(authorId) {
        const { data, error } = await db.getClient()
            .from('series')
            .select(`
                *,
                category:category_id (id, name, slug, icon)
            `)
            .eq('author_id', authorId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    }

    async getChapters(seriesId) {
        const { data, error } = await db.getClient()
            .from('content')
            .select('*')
            .eq('series_id', seriesId)
            .eq('is_published', true)
            .order('chapter_number', { ascending: true });
        
        if (error) throw error;
        return data;
    }

    async update(id, updates) {
        const { data, error } = await db.getClient()
            .from('series')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async delete(id) {
        const { error } = await db.getClient()
            .from('series')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    }
}

module.exports = new SeriesRepository();
