/**
 * Draft Repository
 * Handles draft-related database operations
 */

const db = require('../config/database');

class DraftRepository {
    async create(draftData) {
        const { data, error } = await db.getClient()
            .from('drafts')
            .insert(draftData)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async findById(id) {
        const { data, error } = await db.getClient()
            .from('drafts')
            .select(`
                *,
                author:author_id (
                    id,
                    username,
                    full_name,
                    profile_picture_url
                ),
                series:series_id (
                    id,
                    title,
                    slug
                )
            `)
            .eq('id', id)
            .single();
        
        if (error) return null;
        return data;
    }

    async findByAuthor(authorId) {
        const { data, error } = await db.getClient()
            .from('drafts')
            .select(`
                *,
                series:series_id (
                    id,
                    title,
                    slug
                )
            `)
            .eq('author_id', authorId)
            .order('updated_at', { ascending: false });
        
        if (error) throw error;
        return data;
    }

    async update(id, updates) {
        const { data, error } = await db.getClient()
            .from('drafts')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async delete(id) {
        const { error } = await db.getClient()
            .from('drafts')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    }

    async deleteByAuthor(authorId) {
        const { error } = await db.getClient()
            .from('drafts')
            .delete()
            .eq('author_id', authorId);
        
        if (error) throw error;
        return true;
    }
}

module.exports = new DraftRepository();
