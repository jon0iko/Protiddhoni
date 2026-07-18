/**
 * Unit Tests for PayoutService (services/payoutService.js).
 *
 * Core business rule under test:
 *   payoutable = earned - given-out(tips) - already-withdrawn, floored at 0.
 * Plus the guard rails in processPayout (nothing to withdraw, over-withdraw,
 * insufficient wallet balance) and the wallet debit + withdrawal record on success.
 *
 * The Supabase client is mocked with a small thenable "chain" that mirrors the
 * builder API (select/eq/in/single/insert/update are all await-able).
 */

jest.mock('../../config/database', () => ({ getClient: jest.fn() }));

import db from '../../config/database';
import PayoutService from '../../services/payoutService';

// A thenable stand-in for a Supabase query builder. Every builder method returns
// the same object; awaiting it (or its .single()) resolves to `result`.
function mockChain(result) {
    const chain: any = {};
    for (const m of ['select', 'eq', 'neq', 'in', 'is', 'order', 'limit', 'insert', 'update', 'delete', 'single', 'maybeSingle']) {
        chain[m] = jest.fn(() => chain);
    }
    chain.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
    chain.catch = (reject) => Promise.resolve(result).catch(reject);
    return chain;
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('PayoutService', () => {
    describe('getEarnedKori', () => {
        test('sums completed incoming transaction amounts (mixed string/number)', async () => {
            (db.getClient as jest.Mock).mockReturnValue({
                from: () => mockChain({ data: [{ amount: '50' }, { amount: 10 }, { amount: '2.5' }], error: null })
            });
            expect(await PayoutService.getEarnedKori('wallet-1')).toBe(62.5);
        });

        test('returns 0 on a query error', async () => {
            (db.getClient as jest.Mock).mockReturnValue({
                from: () => mockChain({ data: null, error: { message: 'boom' } })
            });
            expect(await PayoutService.getEarnedKori('wallet-1')).toBe(0);
        });

        test('returns 0 when there are no earnings', async () => {
            (db.getClient as jest.Mock).mockReturnValue({ from: () => mockChain({ data: [], error: null }) });
            expect(await PayoutService.getEarnedKori('wallet-1')).toBe(0);
        });
    });

    describe('getSpentKori', () => {
        test('sums completed outgoing tips', async () => {
            (db.getClient as jest.Mock).mockReturnValue({
                from: () => mockChain({ data: [{ amount: 5 }, { amount: 15 }], error: null })
            });
            expect(await PayoutService.getSpentKori('wallet-1')).toBe(20);
        });
    });

    describe('getWithdrawnKori', () => {
        test('sums completed and pending withdrawals', async () => {
            (db.getClient as jest.Mock).mockReturnValue({
                from: () => mockChain({ data: [{ amount: 100 }, { amount: '25' }], error: null })
            });
            expect(await PayoutService.getWithdrawnKori('wallet-1')).toBe(125);
        });
    });

    describe('getPayoutableAmount (payoutable = earned - spent - withdrawn)', () => {
        beforeEach(() => {
            // Wallet lookup succeeds for these composition tests.
            (db.getClient as jest.Mock).mockReturnValue({ from: () => mockChain({ data: { id: 'wallet-1' }, error: null }) });
        });

        test('computes earned minus given-out minus withdrawn', async () => {
            jest.spyOn(PayoutService, 'getEarnedKori').mockResolvedValue(100);
            jest.spyOn(PayoutService, 'getSpentKori').mockResolvedValue(30);
            jest.spyOn(PayoutService, 'getWithdrawnKori').mockResolvedValue(20);

            expect(await PayoutService.getPayoutableAmount('user-1')).toEqual({
                payoutable: 50,
                earned: 100,
                spent: 30,
                withdrawn: 20
            });
        });

        test('never returns a negative payoutable amount', async () => {
            jest.spyOn(PayoutService, 'getEarnedKori').mockResolvedValue(10);
            jest.spyOn(PayoutService, 'getSpentKori').mockResolvedValue(50);
            jest.spyOn(PayoutService, 'getWithdrawnKori').mockResolvedValue(0);

            const result = await PayoutService.getPayoutableAmount('user-1');
            expect(result.payoutable).toBe(0);
        });

        test('returns all-zeros when the wallet is missing', async () => {
            (db.getClient as jest.Mock).mockReturnValue({ from: () => mockChain({ data: null, error: { message: 'no wallet' } }) });
            expect(await PayoutService.getPayoutableAmount('user-1')).toEqual({
                payoutable: 0,
                earned: 0,
                spent: 0,
                withdrawn: 0
            });
        });
    });

    describe('processPayout', () => {
        test('rejects when there is nothing to withdraw', async () => {
            jest.spyOn(PayoutService, 'getPayoutableAmount').mockResolvedValue({ payoutable: 0, earned: 0, spent: 0, withdrawn: 0 });
            (db.getClient as jest.Mock).mockReturnValue({ from: () => mockChain({ data: null, error: null }) });

            const result = await PayoutService.processPayout('user-1');
            expect(result.success).toBe(false);
            expect(result.error).toBe('উত্তোলনের জন্য কোনো কড়ি নেই');
        });

        test('rejects a request larger than the payoutable amount', async () => {
            jest.spyOn(PayoutService, 'getPayoutableAmount').mockResolvedValue({ payoutable: 50, earned: 50, spent: 0, withdrawn: 0 });
            (db.getClient as jest.Mock).mockReturnValue({ from: () => mockChain({ data: { id: 'wallet-1', balance: 50 }, error: null }) });

            const result = await PayoutService.processPayout('user-1', 100);
            expect(result.success).toBe(false);
            expect(result.error).toContain('বেশি উত্তোলন');
        });

        test('debits the wallet and records a withdrawal on success', async () => {
            jest.spyOn(PayoutService, 'getPayoutableAmount').mockResolvedValue({ payoutable: 50, earned: 50, spent: 0, withdrawn: 0 });

            const walletSelectChain = mockChain({ data: { id: 'wallet-1', balance: 100 }, error: null });
            const walletUpdateChain = mockChain({ error: null });
            const txnInsertChain = mockChain({ data: [{ id: 'trx-1' }], error: null });

            let walletCall = 0;
            (db.getClient as jest.Mock).mockReturnValue({
                from: jest.fn((table) => {
                    if (table === 'wallets') {
                        walletCall += 1;
                        return walletCall === 1 ? walletSelectChain : walletUpdateChain;
                    }
                    return txnInsertChain;
                })
            });

            const result = await PayoutService.processPayout('user-1', 50);

            expect(result.success).toBe(true);
            expect(result.transactionId).toBe('trx-1');
            // Wallet debited by exactly the payout amount (100 - 50).
            expect(walletUpdateChain.update).toHaveBeenCalledWith(expect.objectContaining({ balance: 50 }));
            // A withdrawal transaction was recorded.
            expect(txnInsertChain.insert).toHaveBeenCalledWith(
                expect.arrayContaining([expect.objectContaining({ transaction_type: 'withdrawal', amount: 50 })])
            );
        });
    });
});
