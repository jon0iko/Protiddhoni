export interface ContentQueryFilters {
    searchText?: string;
    categorySlug?: string;
    contentType?: string;
    authorId?: string;
    seriesId?: string;
    minRating?: number;
    status?: string;
    isPremium?: boolean;
}

export interface ContentQuerySort {
    column: string;
    order: string;
}

export interface ContentQueryPagination {
    page: number;
    limit: number;
}

export interface BuiltContentQuery {
    filters: ContentQueryFilters;
    sort: ContentQuerySort;
    pagination: ContentQueryPagination;
}

/**
 * Design Pattern: Builder
 * Constructs complex database queries for content discovery
 */
class ContentQueryBuilder {
    private query: any;
    private filters: ContentQueryFilters;
    private sort: ContentQuerySort;
    private pagination: ContentQueryPagination;

    constructor(baseQuery?: any) {
        this.query = baseQuery;
        this.filters = {};
        this.sort = { column: 'published_at', order: 'desc' };
        this.pagination = { page: 1, limit: 10 };
    }

    setSearchText(text: any): this {
        if (text && typeof text === 'string' && text.trim().length > 0) {
            this.filters.searchText = text.trim();
        }
        return this;
    }

    setCategory(categorySlug: any): this {
        if (categorySlug) {
            this.filters.categorySlug = categorySlug;
        }
        return this;
    }

    setContentType(type: any): this {
        if (type && type !== 'all') {
            this.filters.contentType = type;
        }
        return this;
    }

    setAuthor(authorId: any): this {
        if (authorId) {
            this.filters.authorId = authorId;
        }
        return this;
    }

    setSeries(seriesId: any): this {
        if (seriesId) {
            this.filters.seriesId = seriesId;
        }
        return this;
    }

    setRating(minRating: any): this {
        if (minRating) {
            this.filters.minRating = parseFloat(minRating);
        }
        return this;
    }

    setStatus(status: any): this {
        if (status) {
            this.filters.status = status;
        }
        return this;
    }

    setIsPremium(isPremium: any): this {
        if (isPremium !== undefined && isPremium !== null && isPremium !== '') {
            this.filters.isPremium = isPremium === 'true' || isPremium === true;
        }
        return this;
    }

    setSort(sortBy: any, order: string = 'desc'): this {
        const validColumns = ['published_at', 'view_count', 'created_at', 'title'];
        if (validColumns.includes(sortBy)) {
            this.sort = { column: sortBy, order };
        }
        return this;
    }

    setPagination(page: any, limit: any): this {
        this.pagination.page = Math.max(1, parseInt(page) || 1);
        this.pagination.limit = Math.max(1, Math.min(50, parseInt(limit) || 10));
        return this;
    }

    /**
     * Builds the final query object to be used by the repository
     */
    build(): BuiltContentQuery {
        return {
            filters: this.filters,
            sort: this.sort,
            pagination: this.pagination
        };
    }
}

export default ContentQueryBuilder;
