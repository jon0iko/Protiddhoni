/**
 * Unit Tests for ContentQueryBuilder (Builder pattern, utils/ContentQueryBuilder.js).
 * Verifies filter accumulation, input coercion, sort whitelisting, and the
 * pagination clamping rules that protect the content-discovery queries.
 */

const ContentQueryBuilder = require('../../utils/ContentQueryBuilder');

describe('ContentQueryBuilder', () => {
    const newBuilder = () => new ContentQueryBuilder('base-query');

    describe('defaults', () => {
        test('builds with empty filters and sensible sort/pagination defaults', () => {
            const result = newBuilder().build();
            expect(result).toEqual({
                filters: {},
                sort: { column: 'published_at', order: 'desc' },
                pagination: { page: 1, limit: 10 }
            });
        });
    });

    describe('fluent interface', () => {
        test('every setter returns the builder for chaining', () => {
            const b = newBuilder();
            expect(b.setSearchText('x')).toBe(b);
            expect(b.setCategory('c')).toBe(b);
            expect(b.setContentType('story')).toBe(b);
            expect(b.setAuthor('a')).toBe(b);
            expect(b.setSeries('s')).toBe(b);
            expect(b.setRating(3)).toBe(b);
            expect(b.setStatus('published')).toBe(b);
            expect(b.setIsPremium(true)).toBe(b);
            expect(b.setSort('title')).toBe(b);
            expect(b.setPagination(1, 10)).toBe(b);
        });
    });

    describe('setSearchText', () => {
        test('trims surrounding whitespace', () => {
            expect(newBuilder().setSearchText('  hello  ').build().filters.searchText).toBe('hello');
        });

        test('ignores empty or whitespace-only text', () => {
            expect(newBuilder().setSearchText('   ').build().filters.searchText).toBeUndefined();
            expect(newBuilder().setSearchText('').build().filters.searchText).toBeUndefined();
        });
    });

    describe('setContentType', () => {
        test('records a concrete content type', () => {
            expect(newBuilder().setContentType('poem').build().filters.contentType).toBe('poem');
        });

        test('ignores the sentinel value "all"', () => {
            expect(newBuilder().setContentType('all').build().filters.contentType).toBeUndefined();
        });
    });

    describe('setIsPremium', () => {
        test('coerces the string "true" and boolean true to true', () => {
            expect(newBuilder().setIsPremium('true').build().filters.isPremium).toBe(true);
            expect(newBuilder().setIsPremium(true).build().filters.isPremium).toBe(true);
        });

        test('coerces other defined values to false', () => {
            expect(newBuilder().setIsPremium('false').build().filters.isPremium).toBe(false);
            expect(newBuilder().setIsPremium(false).build().filters.isPremium).toBe(false);
        });

        test('ignores undefined, null, and empty string', () => {
            expect(newBuilder().setIsPremium(undefined).build().filters.isPremium).toBeUndefined();
            expect(newBuilder().setIsPremium(null).build().filters.isPremium).toBeUndefined();
            expect(newBuilder().setIsPremium('').build().filters.isPremium).toBeUndefined();
        });
    });

    describe('setRating', () => {
        test('parses the minimum rating as a float', () => {
            expect(newBuilder().setRating('4.5').build().filters.minRating).toBe(4.5);
        });

        test('ignores a falsy rating', () => {
            expect(newBuilder().setRating(0).build().filters.minRating).toBeUndefined();
        });
    });

    describe('setSort', () => {
        test.each(['published_at', 'view_count', 'created_at', 'title'])(
            'accepts the whitelisted column %s',
            (column) => {
                expect(newBuilder().setSort(column, 'asc').build().sort).toEqual({ column, order: 'asc' });
            }
        );

        test('ignores a non-whitelisted column and keeps the default sort', () => {
            expect(newBuilder().setSort('DROP TABLE').build().sort).toEqual({
                column: 'published_at',
                order: 'desc'
            });
        });

        test('defaults the order to desc when omitted', () => {
            expect(newBuilder().setSort('title').build().sort).toEqual({ column: 'title', order: 'desc' });
        });
    });

    describe('setPagination', () => {
        test('accepts numeric string inputs', () => {
            expect(newBuilder().setPagination('2', '20').build().pagination).toEqual({ page: 2, limit: 20 });
        });

        test('clamps page to a minimum of 1', () => {
            expect(newBuilder().setPagination(0, 10).build().pagination.page).toBe(1);
            expect(newBuilder().setPagination(-5, 10).build().pagination.page).toBe(1);
        });

        test('caps limit at 50', () => {
            expect(newBuilder().setPagination(1, 100).build().pagination.limit).toBe(50);
        });

        test('falls back to a limit of 10 for invalid input', () => {
            expect(newBuilder().setPagination(1, 'abc').build().pagination.limit).toBe(10);
        });
    });

    describe('composition', () => {
        test('accumulates multiple filters into one query object', () => {
            const result = newBuilder()
                .setSearchText('rain')
                .setCategory('poetry')
                .setContentType('poem')
                .setIsPremium('true')
                .setSort('view_count', 'asc')
                .setPagination(3, 25)
                .build();

            expect(result).toEqual({
                filters: {
                    searchText: 'rain',
                    categorySlug: 'poetry',
                    contentType: 'poem',
                    isPremium: true
                },
                sort: { column: 'view_count', order: 'asc' },
                pagination: { page: 3, limit: 25 }
            });
        });
    });
});
