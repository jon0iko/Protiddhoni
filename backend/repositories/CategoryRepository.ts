/**
 * Design Pattern: Repository
 * Abstract data access layer for categories
 */

import db from '../config/database';

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

    async create(categoryData) {
        const { data, error } = await db.getClient()
            .from('categories')
            .insert(categoryData)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async delete(id) {
        const { error } = await db.getClient()
            .from('categories')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    }
}

export default new CategoryRepository();
