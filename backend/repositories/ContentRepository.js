/**
 * Design Pattern: Repository
 * Abstract data access layer for content
 */

const db = require('../config/database');

class ContentRepository {
    async create(contentData) {
        const { data, error } = await db.getClient()
            .from('content')
            .insert(contentData)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async findById(id) {
        const { data, error } = await db.getClient()
            .from('content')
            .select(`
                *,
                author:author_id (id, username, full_name, profile_picture_url, bio),
                category:category_id (id, name, slug, icon),
                series:series_id (id, title, slug, total_chapters, is_completed)
            `)
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    }

    async findBySlug(slug) {
        const { data, error } = await db.getClient()
            .from('content')
            .select(`
                *,
                author:author_id (id, username, full_name, profile_picture_url, bio),
                category:category_id (id, name, slug, icon),
                series:series_id (id, title, slug, total_chapters, is_completed)
            `)
            .eq('slug', slug)
            .single();
        
        if (error) return null;
        return data;
    }

    async findPublished(filters = {}) {
        let query = db.getClient()
            .from('content')
            .select(`
                *,
                author:author_id (id, username, full_name, profile_picture_url),
                category:category_id (id, name, slug, icon),
                series:series_id (id, title, slug)
            `)
            .eq('is_published', true)
            .eq('status', 'approved')
            .order('published_at', { ascending: false });

        // Apply filters
        if (filters.category_id) {
            query = query.eq('category_id', filters.category_id);
        }
        if (filters.content_type) {
            query = query.eq('content_type', filters.content_type);
        }
        if (filters.author_id) {
            query = query.eq('author_id', filters.author_id);
        }
        if (filters.series_id) {
            query = query.eq('series_id', filters.series_id);
        }
        if (filters.is_premium !== undefined) {
            query = query.eq('is_premium', filters.is_premium);
        }
        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    async findByCategory(categorySlug, limit = 10) {
        const { data, error } = await db.getClient()
            .from('content')
            .select(`
                *,
                author:author_id (id, username, full_name, profile_picture_url),
                category:category_id!inner (id, name, slug, icon)
            `)
            .eq('is_published', true)
            .eq('status', 'approved')
            .eq('category.slug', categorySlug)
            .order('published_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    }

    async findByAuthor(authorId) {
        const { data, error } = await db.getClient()
            .from('content')
            .select(`
                *,
                category:category_id (id, name, slug, icon),
                series:series_id (id, title, slug)
            `)
            .eq('author_id', authorId)
            .eq('is_published', true)
            .eq('status', 'approved')
            .order('published_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    async findDraftsByAuthor(authorId) {
        const { data, error } = await db.getClient()
            .from('content')
            .select('*')
            .eq('author_id', authorId)
            .eq('status', 'draft')
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    async findPending() {
        const { data, error } = await db.getClient()
            .from('content')
            .select(`
                *,
                author:author_id (id, username, full_name, profile_picture_url),
                category:category_id (id, name, slug)
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        return data;
    }

    async update(id, updates) {
        const { data, error } = await db.getClient()
            .from('content')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async incrementViewCount(id) {
        const { data, error } = await db.getClient()
            .rpc('increment_view_count', { content_id: id });
        
        if (error) console.error('Error incrementing view count:', error);
        return data;
    }

    async delete(id) {
        const { error } = await db.getClient()
            .from('content')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    }

    async getStats(contentId) {
        // Get review stats
        const { data: reviews, error: reviewError } = await db.getClient()
            .from('reviews')
            .select('rating')
            .eq('content_id', contentId);

        if (reviewError) throw reviewError;

        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        return {
            totalReviews: reviews.length,
            averageRating: Math.round(avgRating * 10) / 10
        };
    }

    /**
     * Advanced search using the Builder pattern output
     * @param {Object} queryParams - Built by ContentQueryBuilder
     */
    async findAdvanced(queryParams) {
        const { filters, sort, pagination } = queryParams;
        
        let query = db.getClient()
            .from('content')
            .select(`
                *,
                author:author_id (id, username, full_name, profile_picture_url),
                category:category_id!inner (id, name, slug, icon),
                series:series_id (id, title, slug)
            `, { count: 'exact' })
            .eq('is_published', true)
            .eq('status', 'approved');

        // Apply Filters
        if (filters.categorySlug) {
            query = query.eq('category.slug', filters.categorySlug);
        }
        if (filters.contentType) {
            query = query.eq('content_type', filters.contentType);
        }
        if (filters.authorId) {
            query = query.eq('author_id', filters.authorId);
        }
        if (filters.seriesId) {
            query = query.eq('series_id', filters.seriesId);
        }
        if (filters.isPremium !== undefined) {
            query = query.eq('is_premium', filters.isPremium);
        }

        // Apply Sorting
        query = query.order(sort.column, { ascending: sort.order === 'asc' });

        // Apply Pagination
        const from = (pagination.page - 1) * pagination.limit;
        const to = from + pagination.limit - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;
        
        if (error) throw error;

        // Post-processing for Rating Filter (since it's in a separate table)
        // Note: In a real high-scale app, we'd denormalize average_rating to the content table.
        // For this assignment, we'll filter in memory or do a join if possible.
        // Supabase join filtering is tricky on computed columns. 
        // Let's assume we filter after fetching for now, or if the user wants "minRating",
        // we might need a more complex query. 
        // For simplicity and performance in this scope, let's filter the results if minRating is present.
        
        let results = data;
        if (filters.minRating) {
            // Fetch ratings for these contents
            const contentIds = data.map(c => c.id);
            const { data: reviews } = await db.getClient()
                .from('reviews')
                .select('content_id, rating')
                .in('content_id', contentIds);

            const ratingMap = {};
            reviews.forEach(r => {
                if (!ratingMap[r.content_id]) ratingMap[r.content_id] = [];
                ratingMap[r.content_id].push(r.rating);
            });

            results = data.filter(item => {
                const itemReviews = ratingMap[item.id] || [];
                const avg = itemReviews.length > 0 
                    ? itemReviews.reduce((a, b) => a + b, 0) / itemReviews.length 
                    : 0;
                item.average_rating = avg; // Attach it while we are here
                return avg >= filters.minRating;
            });
        }

        return { data: results, count };
    }
}

module.exports = new ContentRepository();
