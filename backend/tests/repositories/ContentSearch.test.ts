import db from '../../config/database';
import ContentRepository from '../../repositories/ContentRepository';

jest.mock('../../config/database', () => ({
    __esModule: true,
    default: {
        getClient: jest.fn()
    }
}));

function queryChain(result: { data: any[]; error: any; count?: number }) {
    const chain: any = {
        select: jest.fn(),
        eq: jest.fn(),
        or: jest.fn(),
        order: jest.fn(),
        range: jest.fn(),
        then: (resolve, reject) => Promise.resolve(result).then(resolve, reject)
    };

    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.or.mockReturnValue(chain);
    chain.order.mockReturnValue(chain);
    chain.range.mockReturnValue(chain);
    return chain;
}

describe('ContentRepository author-aware search', () => {
    test('includes content from matching author usernames or full names', async () => {
        const authorQuery = queryChain({
            data: [{ id: 'author-1' }],
            error: null
        });
        const contentRow = {
            id: 'content-1',
            title: 'অন্য গল্প',
            excerpt: '',
            published_at: '2026-01-01',
            author: {
                id: 'author-1',
                username: 'sumitra',
                full_name: 'সুমিত্রা দেবী'
            }
        };
        const contentQuery = queryChain({
            data: [contentRow],
            error: null,
            count: 1
        });
        const client = {
            from: jest.fn((table: string) => table === 'users' ? authorQuery : contentQuery)
        };
        (db.getClient as jest.Mock).mockReturnValue(client);

        const result = await ContentRepository.findAdvanced({
            filters: { searchText: 'সুমিত্রা দেবী' },
            sort: { column: 'relevance', order: 'desc' },
            pagination: { page: 1, limit: 5 }
        });

        expect(authorQuery.or).toHaveBeenCalledWith(
            'username.ilike.%সুমিত্রা দেবী%,full_name.ilike.%সুমিত্রা দেবী%'
        );
        expect(contentQuery.or).toHaveBeenCalledWith(
            expect.stringContaining('author_id.in.(author-1)')
        );
        expect(result).toEqual({ data: [contentRow], count: 1 });
    });
});
