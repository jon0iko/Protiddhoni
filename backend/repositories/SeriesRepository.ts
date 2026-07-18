/**
 * Design Pattern: Repository
 * Abstract data access layer for series
 */

import db from '../config/database';

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

    async findPublishedPaginated(filters: Record<string, any> = {}) {
        const { 
            category_id, 
            author_id,
            sort_by = 'created_at',
            order = 'desc',
            page = 1,
            limit = 9
        } = filters;

        let query = db.getClient()
            .from('series')
            .select(`
                *,
                author:author_id (id, username, full_name, profile_picture_url),
                category:category_id (id, name, slug, icon)
            `, { count: 'exact' });

        // Apply filters
        if (category_id) {
            query = query.eq('category_id', category_id);
        }
        if (author_id) {
            query = query.eq('author_id', author_id);
        }

        // Apply sorting
        const validSortColumns = ['created_at', 'updated_at', 'title', 'total_chapters'];
        const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
        const sortOrder = order === 'asc' ? true : false;
        query = query.order(sortColumn, { ascending: sortOrder });

        // Apply pagination
        const pageNum = Math.max(1, parseInt(page) || 1);
        const pageLimit = Math.max(1, Math.min(50, parseInt(limit) || 9));
        const from = (pageNum - 1) * pageLimit;
        const to = from + pageLimit - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;
        if (error) throw error;

        return {
            data,
            pagination: {
                page: pageNum,
                limit: pageLimit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / pageLimit)
            }
        };
    }

    async findPublished(filters: Record<string, any> = {}) {
        let query = db.getClient()
            .from('series')
            .select(`
                *,
                author:author_id (id, username, full_name, profile_picture_url),
                category:category_id (id, name, slug, icon)
            `)
            .order('created_at', { ascending: false });

        // Apply filters
        if (filters.category_id) {
            query = query.eq('category_id', filters.category_id);
        }
        if (filters.author_id) {
            query = query.eq('author_id', filters.author_id);
        }
        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }
}

export default new SeriesRepository();
