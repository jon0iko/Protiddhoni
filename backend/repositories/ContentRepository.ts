/**
 * Design Pattern: Repository
 * Abstract data access layer for content
 */

import db from '../config/database';
import logger from '../config/logger';

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

    async findPublished(filters: Record<string, any> = {}) {
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

    async findPublishedPaginated(filters: Record<string, any> = {}) {
        const { 
            category_id, 
            content_type, 
            author_id, 
            series_id, 
            is_premium,
            sort_by = 'published_at',
            order = 'desc',
            page = 1,
            limit = 9,
            include_chapters = false
        } = filters;

        let query = db.getClient()
            .from('content')
            .select(`
                *,
                author:author_id (id, username, full_name, profile_picture_url),
                category:category_id (id, name, slug, icon),
                series:series_id (id, title, slug)
            `, { count: 'exact' })
            .eq('is_published', true)
            .eq('status', 'approved');

        // Exclude chapters from main listing unless specifically requested
        if (!include_chapters && !series_id) {
            query = query.is('series_id', null);
        }

        // Apply filters
        if (category_id) {
            query = query.eq('category_id', category_id);
        }
        if (content_type) {
            query = query.eq('content_type', content_type);
        }
        if (author_id) {
            query = query.eq('author_id', author_id);
        }
        if (series_id) {
            query = query.eq('series_id', series_id);
        }
        if (is_premium !== undefined) {
            query = query.eq('is_premium', is_premium);
        }

        // Apply sorting
        const validSortColumns = ['published_at', 'view_count', 'created_at', 'title'];
        const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'published_at';
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
                author:author_id (id, username, full_name, profile_picture_url, bio),
                category:category_id (id, name, slug, icon),
                series:series_id (id, title, slug)
            `)
            .eq('author_id', authorId)
            .order('updated_at', { ascending: false });

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

    async incrementViewCountWithSession(contentId, sessionKey, viewerKey) {
        const { data, error } = await db.getClient()
            .rpc('increment_view_count_once', {
                p_content_id: contentId,
                p_session_key: sessionKey,
                p_viewer_key: viewerKey
            });

        if (!error) {
            logger.debug('[ViewCount] RPC increment_view_count_once result:', {
                contentId,
                sessionKeyPreview: sessionKey?.slice(0, 12),
                viewerKeyPreview: viewerKey?.slice(0, 12),
                counted: data === true
            });
            return data;
        }

        logger.error('[ViewCount] RPC increment_view_count_once failed:', {
            contentId,
            sessionKeyPreview: sessionKey?.slice(0, 12),
            viewerKeyPreview: viewerKey?.slice(0, 12),
            message: error.message,
            code: error.code
        });

        // Safe fallback path: dedupe via table-level unique constraint.
        const { data: insertedRows, error: insertError } = await db.getClient()
            .from('content_view_sessions')
            .upsert(
                {
                    content_id: contentId,
                    session_key: sessionKey,
                    viewer_key: viewerKey
                },
                {
                    onConflict: 'content_id,session_key',
                    ignoreDuplicates: true
                }
            )
            .select('id');

        if (insertError) {
            logger.error('[ViewCount] Table fallback failed, skipping increment:', {
                contentId,
                message: insertError.message,
                code: insertError.code
            });
            return false;
        }

        const counted = Array.isArray(insertedRows) && insertedRows.length > 0;
        if (counted) {
            await this.incrementViewCount(contentId);
        }

        logger.debug('[ViewCount] Table fallback result:', {
            contentId,
            sessionKeyPreview: sessionKey?.slice(0, 12),
            viewerKeyPreview: viewerKey?.slice(0, 12),
            counted
        });

        return counted;
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
        // Aggregate review stats inside Postgres (COUNT + AVG) via RPC instead of
        // pulling every review row into Node and averaging in JS. See
        // scripts/optimization_migrations.sql for get_content_review_stats.
        const { data, error } = await db.getClient()
            .rpc('get_content_review_stats', { p_content_id: contentId });

        if (!error && Array.isArray(data)) {
            const row = data[0] || {};
            return {
                totalReviews: Number(row.total_reviews) || 0,
                averageRating: Number(row.average_rating) || 0
            };
        }

        // Fallback: if the RPC is not deployed yet, use the original in-JS path so
        // behaviour is preserved until the migration is run.
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

        // Use inner join only when filtering by category slug, so content with no
        // category isn't accidentally hidden.
        const categoryJoin = filters.categorySlug
            ? 'category:category_id!inner (id, name, slug, icon)'
            : 'category:category_id (id, name, slug, icon)';

        const buildBaseQuery = (countOption) => {
            let q = db.getClient()
                .from('content')
                .select(`
                    *,
                    author:author_id (id, username, full_name, profile_picture_url),
                    ${categoryJoin},
                    series:series_id (id, title, slug)
                `, countOption)
                .eq('is_published', true)
                .eq('status', 'approved');

            if (filters.searchText) {
                const escaped = filters.searchText.replace(/[%,()]/g, ' ');
                const term = `%${escaped}%`;
                q = q.or(`title.ilike.${term},excerpt.ilike.${term}`);
            }
            if (filters.categorySlug) {
                q = q.eq('category.slug', filters.categorySlug);
            }
            if (filters.contentType) {
                q = q.eq('content_type', filters.contentType);
            }
            if (filters.authorId) {
                q = q.eq('author_id', filters.authorId);
            }
            if (filters.seriesId) {
                q = q.eq('series_id', filters.seriesId);
            }
            if (filters.isPremium !== undefined) {
                q = q.eq('is_premium', filters.isPremium);
            }
            return q;
        };

        // When filtering by minimum rating, we must filter in memory (ratings live
        // in a separate table). Fetch the full filtered set, compute averages,
        // then paginate after — so total count and page slicing are correct.
        if (filters.minRating) {
            const fullQuery = buildBaseQuery({ count: 'exact' })
                .order(sort.column, { ascending: sort.order === 'asc' });

            const { data: allData, error: fullError } = await fullQuery;
            if (fullError) throw fullError;

            const contentIds = (allData || []).map(c => c.id);
            let ratingMap = {};
            if (contentIds.length > 0) {
                const { data: reviews } = await db.getClient()
                    .from('reviews')
                    .select('content_id, rating')
                    .in('content_id', contentIds);

                (reviews || []).forEach(r => {
                    if (!ratingMap[r.content_id]) ratingMap[r.content_id] = [];
                    ratingMap[r.content_id].push(r.rating);
                });
            }

            const filtered = (allData || []).filter(item => {
                const itemReviews = ratingMap[item.id] || [];
                const avg = itemReviews.length > 0
                    ? itemReviews.reduce((a, b) => a + b, 0) / itemReviews.length
                    : 0;
                item.average_rating = avg;
                return avg >= filters.minRating;
            });

            const from = (pagination.page - 1) * pagination.limit;
            const to = from + pagination.limit;
            return { data: filtered.slice(from, to), count: filtered.length };
        }

        // Standard path: paginate at the database.
        const query = buildBaseQuery({ count: 'exact' })
            .order(sort.column, { ascending: sort.order === 'asc' });

        const from = (pagination.page - 1) * pagination.limit;
        const to = from + pagination.limit - 1;
        const { data, error, count } = await query.range(from, to);

        if (error) throw error;
        return { data: data || [], count: count || 0 };
    }
}

export default new ContentRepository();
