import {
    getContentSearchRank,
    normalizeSearchText,
    sortContentByRelevance
} from '../../utils/searchRanking';

const content = (
    title: string,
    excerpt: string,
    author: { username: string; full_name: string },
    publishedAt = '2026-01-01'
) => ({
    title,
    excerpt,
    author,
    published_at: publishedAt
});

describe('search ranking', () => {
    test('normalizes Bengali text and removes invisible Unicode characters', () => {
        expect(normalizeSearchText('  স্ব\u200Bপ্ন  ')).toBe('স্বপ্ন');
    });

    test('ranks title matches ahead of author and excerpt matches', () => {
        const query = 'স্বপ্ন';
        const exactTitle = content('স্বপ্ন', '', { username: 'writer', full_name: 'লেখক' });
        const titlePrefix = content('স্বপ্ন দেখা', '', { username: 'writer', full_name: 'লেখক' });
        const exactAuthor = content('অন্য গল্প', '', { username: 'shopno', full_name: 'স্বপ্ন' });
        const titleContains = content('রিকশাওয়ালার স্বপ্ন', '', { username: 'writer', full_name: 'লেখক' });
        const excerptMatch = content('অন্য গল্প', 'একটি স্বপ্নের গল্প', {
            username: 'writer',
            full_name: 'লেখক'
        });

        expect(getContentSearchRank(exactTitle, query)).toBeLessThan(
            getContentSearchRank(titlePrefix, query)
        );
        expect(getContentSearchRank(titlePrefix, query)).toBeLessThan(
            getContentSearchRank(exactAuthor, query)
        );
        expect(getContentSearchRank(exactAuthor, query)).toBeLessThan(
            getContentSearchRank(titleContains, query)
        );
        expect(getContentSearchRank(titleContains, query)).toBeLessThan(
            getContentSearchRank(excerptMatch, query)
        );
    });

    test('ranks content from exact and partial author-name matches', () => {
        const exactAuthor = content('গল্প এক', '', {
            username: 'sumitra',
            full_name: 'সুমিত্রা দেবী'
        });
        const partialAuthor = content('গল্প দুই', '', {
            username: 'sumitra-devi',
            full_name: 'লেখক সুমিত্রা দেবী'
        });

        expect(getContentSearchRank(exactAuthor, 'সুমিত্রা দেবী')).toBe(2);
        expect(getContentSearchRank(partialAuthor, 'সুমিত্রা')).toBe(5);
    });

    test('uses publication date to break equal relevance ties', () => {
        const older = content(
            'স্বপ্নের গল্প',
            '',
            { username: 'one', full_name: 'এক' },
            '2025-01-01'
        );
        const newer = content(
            'স্বপ্নের কবিতা',
            '',
            { username: 'two', full_name: 'দুই' },
            '2026-01-01'
        );

        expect(sortContentByRelevance([older, newer], 'স্বপ্ন')).toEqual([newer, older]);
    });
});
