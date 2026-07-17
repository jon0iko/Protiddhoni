/**
 * Unit Tests for ContentPurchaseService (services/contentPurchaseService.js).
 *
 * Core business rules under test:
 *   - hasPurchased treats "no rows" (PGRST116) as not-purchased.
 *   - purchaseContent enforces: no double-buy, cannot buy your own content,
 *     must have sufficient Kori, and on success runs the atomic transfer and
 *     records the purchase.
 */

jest.mock('../../config/database', () => ({ getClient: jest.fn() }));

const db = require('../../config/database');
const ContentPurchaseService = require('../../services/contentPurchaseService');

// Thenable stand-in for a Supabase query builder chain.
function mockChain(result) {
    const chain = {};
    for (const m of ['select', 'eq', 'neq', 'in', 'is', 'order', 'limit', 'insert', 'update', 'delete', 'single', 'maybeSingle']) {
        chain[m] = jest.fn(() => chain);
    }
    chain.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
    chain.catch = (reject) => Promise.resolve(result).catch(reject);
    return chain;
}

const BUYER = 'buyer-1';

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('ContentPurchaseService', () => {
    describe('hasPurchased', () => {
        test('returns true when a purchase row exists', async () => {
            db.getClient.mockReturnValue({ from: () => mockChain({ data: { id: 'purchase-1' }, error: null }) });
            expect(await ContentPurchaseService.hasPurchased(BUYER, 'content-1')).toBe(true);
        });

        test('returns false when no purchase row exists (PGRST116)', async () => {
            db.getClient.mockReturnValue({ from: () => mockChain({ data: null, error: { code: 'PGRST116' } }) });
            expect(await ContentPurchaseService.hasPurchased(BUYER, 'content-1')).toBe(false);
        });
    });

    describe('purchaseContent', () => {
        test('blocks a second purchase of the same content', async () => {
            db.getClient.mockReturnValue({});
            jest.spyOn(ContentPurchaseService, 'hasPurchased').mockResolvedValue(true);

            const result = await ContentPurchaseService.purchaseContent(BUYER, 'content-1', 50);
            expect(result.success).toBe(false);
            expect(result.error).toBe('সামগ্রী ইতিমধ্যে ক্রয় করেছেন');
        });

        test('returns not-found when the content does not exist', async () => {
            jest.spyOn(ContentPurchaseService, 'hasPurchased').mockResolvedValue(false);
            db.getClient.mockReturnValue({ from: () => mockChain({ data: null, error: { message: 'missing' } }) });

            const result = await ContentPurchaseService.purchaseContent(BUYER, 'content-1', 50);
            expect(result.success).toBe(false);
            expect(result.error).toBe('সামগ্রী খুঁজে পাওয়া যায়নি');
        });

        test('prevents an author from buying their own content', async () => {
            jest.spyOn(ContentPurchaseService, 'hasPurchased').mockResolvedValue(false);
            db.getClient.mockReturnValue({
                from: () => mockChain({ data: { id: 'content-1', title: 'T', author_id: BUYER, price: 50 }, error: null })
            });

            const result = await ContentPurchaseService.purchaseContent(BUYER, 'content-1', 50);
            expect(result.success).toBe(false);
            expect(result.error).toBe('নিজের সামগ্রী ক্রয় করতে পারবেন না');
        });

        test('blocks the purchase when the buyer has insufficient Kori', async () => {
            jest.spyOn(ContentPurchaseService, 'hasPurchased').mockResolvedValue(false);
            db.getClient.mockReturnValue({
                from: jest.fn((table) => {
                    if (table === 'content') {
                        return mockChain({ data: { id: 'content-1', title: 'T', author_id: 'author-1', price: 50 }, error: null });
                    }
                    // buyer wallet with too little balance
                    return mockChain({ data: { id: 'buyer-wallet', balance: 10 }, error: null });
                })
            });

            const result = await ContentPurchaseService.purchaseContent(BUYER, 'content-1', 50);
            expect(result.success).toBe(false);
            expect(result.error).toBe('পর্যাপ্ত কড়ি নেই');
        });

        test('transfers Kori and records the purchase on success', async () => {
            jest.spyOn(ContentPurchaseService, 'hasPurchased').mockResolvedValue(false);

            const purchaseInsertChain = mockChain({ error: null });
            const rpc = jest.fn(() => Promise.resolve({ data: 'trx-9', error: null }));

            let walletCall = 0;
            db.getClient.mockReturnValue({
                from: jest.fn((table) => {
                    if (table === 'content') {
                        return mockChain({ data: { id: 'content-1', title: 'T', author_id: 'author-1', price: 50 }, error: null });
                    }
                    if (table === 'wallets') {
                        walletCall += 1;
                        return walletCall === 1
                            ? mockChain({ data: { id: 'buyer-wallet', balance: 100 }, error: null }) // buyer
                            : mockChain({ data: { id: 'author-wallet' }, error: null }); // author
                    }
                    return purchaseInsertChain; // content_purchases insert
                }),
                rpc
            });

            const result = await ContentPurchaseService.purchaseContent(BUYER, 'content-1', 50);

            expect(result.success).toBe(true);
            expect(result.transaction_id).toBe('trx-9');
            // Atomic peer-to-peer transfer invoked with the correct amount + type.
            expect(rpc).toHaveBeenCalledWith('transfer_kori', expect.objectContaining({
                sender_wallet_id: 'buyer-wallet',
                receiver_wallet_id: 'author-wallet',
                transfer_amount: 50,
                trx_type: 'content_purchase'
            }));
            // Purchase recorded.
            expect(purchaseInsertChain.insert).toHaveBeenCalledWith(
                expect.arrayContaining([expect.objectContaining({ user_id: BUYER, content_id: 'content-1', amount: 50 })])
            );
        });

        test('maps the RPC "Insufficient funds" error to the Bengali balance message', async () => {
            jest.spyOn(ContentPurchaseService, 'hasPurchased').mockResolvedValue(false);

            const rpc = jest.fn(() => Promise.resolve({ data: null, error: { message: 'Insufficient funds in wallet' } }));
            let walletCall = 0;
            db.getClient.mockReturnValue({
                from: jest.fn((table) => {
                    if (table === 'content') {
                        return mockChain({ data: { id: 'content-1', title: 'T', author_id: 'author-1', price: 50 }, error: null });
                    }
                    walletCall += 1;
                    return walletCall === 1
                        ? mockChain({ data: { id: 'buyer-wallet', balance: 100 }, error: null })
                        : mockChain({ data: { id: 'author-wallet' }, error: null });
                }),
                rpc
            });

            const result = await ContentPurchaseService.purchaseContent(BUYER, 'content-1', 50);
            expect(result.success).toBe(false);
            expect(result.error).toBe('পর্যাপ্ত কড়ি নেই');
        });
    });
});
