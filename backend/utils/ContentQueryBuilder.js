/**
 * Design Pattern: Builder
 * Constructs complex database queries for content discovery
 */
class ContentQueryBuilder {
    constructor(baseQuery) {
        this.query = baseQuery;
        this.filters = {};
        this.sort = { column: 'published_at', order: 'desc' };
        this.pagination = { page: 1, limit: 10 };
    }

    setCategory(categorySlug) {
        if (categorySlug) {
            this.filters.categorySlug = categorySlug;
        }
        return this;
    }

    setContentType(type) {
        if (type && type !== 'all') {
            this.filters.contentType = type;
        }
        return this;
    }

    setAuthor(authorId) {
        if (authorId) {
            this.filters.authorId = authorId;
        }
        return this;
    }

    setSeries(seriesId) {
        if (seriesId) {
            this.filters.seriesId = seriesId;
        }
        return this;
    }

    setRating(minRating) {
        if (minRating) {
            this.filters.minRating = parseFloat(minRating);
        }
        return this;
    }

    setStatus(status) {
        if (status) {
            this.filters.status = status;
        }
        return this;
    }

    setIsPremium(isPremium) {
        if (isPremium !== undefined && isPremium !== null && isPremium !== '') {
            this.filters.isPremium = isPremium === 'true' || isPremium === true;
        }
        return this;
    }

    setSort(sortBy, order = 'desc') {
        const validColumns = ['published_at', 'view_count', 'created_at', 'title'];
        if (validColumns.includes(sortBy)) {
            this.sort = { column: sortBy, order };
        }
        return this;
    }

    setPagination(page, limit) {
        this.pagination.page = Math.max(1, parseInt(page) || 1);
        this.pagination.limit = Math.max(1, Math.min(50, parseInt(limit) || 10));
        return this;
    }

    /**
     * Builds the final query object to be used by the repository
     * @returns {Object} The constructed query parameters
     */
    build() {
        return {
            filters: this.filters,
            sort: this.sort,
            pagination: this.pagination
        };
    }
}

module.exports = ContentQueryBuilder;
