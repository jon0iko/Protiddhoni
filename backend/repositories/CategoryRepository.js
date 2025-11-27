/**
 * Design Pattern: Repository
 * Abstract data access layer for categories
 */

const db = require('../config/database');

class CategoryRepository {
    async findAll() {
        const { data, error } = await db.getClient()
            .from('categories')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) throw error;
        return data;
    }

    async findBySlug(slug) {
        const { data, error } = await db.getClient()
            .from('categories')
            .select('*')
            .eq('slug', slug)
            .single();
        
        if (error) return null;
        return data;
    }

    async findById(id) {
        const { data, error } = await db.getClient()
            .from('categories')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) return null;
        return data;
    }

    async getContentCount(categoryId) {
        const { count, error } = await db.getClient()
            .from('content')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', categoryId)
            .eq('is_published', true)
            .eq('status', 'approved');
        
        if (error) return 0;
        return count || 0;
    }
}

module.exports = new CategoryRepository();
