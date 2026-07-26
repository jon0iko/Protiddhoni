/**
 * WalletService -- the Kori money path.
 *
 * The service itself is deliberately thin: the actual debit/credit/ledger write
 * happens inside the transfer_kori PostgreSQL function so that two concurrent
 * tips cannot both read the same starting balance. What this suite pins is the
 * service's half of that contract -- that it resolves both wallets first, refuses
 * to call the RPC when either is missing, passes the right wallet ids in the
 * right direction, and propagates the database's refusal rather than swallowing it.
 *
 * Testable at all only because the constructor's `this.supabase = db.getClient()`
 * was replaced with a per-call getter; the module instantiates itself at import,
 * so the client used to be bound before any test could install a mock.
 */

jest.mock('../../config/database');
jest.mock('../../config/logger', () => ({
    __esModule: true,
    default: { error: jest.fn(), info: jest.fn(), debug: jest.fn(), warn: jest.fn() }
}));

import walletService from '../../services/walletService';
import { queryChain, useClient, supabaseClient, PGRST116 } from '../helpers/supabaseMock';

const wallet = (id: string, userId: string, balance = 100) => ({ id, user_id: userId, balance });

beforeEach(() => {
    jest.clearAllMocks();
});

describe('getWalletByUserId()', () => {
    it('returns the wallet row', async () => {
        const row = wallet('w1', 'u1');
        useClient(supabaseClient({ tables: { wallets: { data: row, error: null } } }));

        await expect(walletService.getWalletByUserId('u1')).resolves.toEqual(row);
    });

    it('returns null for a user with no wallet rather than throwing', async () => {
        useClient(supabaseClient({ tables: { wallets: { data: null, error: PGRST116 } } }));

        await expect(walletService.getWalletByUserId('u1')).resolves.toBeNull();
    });

    it('scopes the lookup to the user', async () => {
        const chain = queryChain({ data: wallet('w1', 'u1'), error: null });
        useClient(supabaseClient({ tables: { wallets: chain } }));

        await walletService.getWalletByUserId('u1');

        expect(chain.eq).toHaveBeenCalledWith('user_id', 'u1');
    });

    it('masks a real database error behind a generic message', async () => {
        useClient(supabaseClient({
            tables: { wallets: { data: null, error: { code: '42501', message: 'permission denied for relation wallets' } } }
        }));

        // The original error is logged but not surfaced -- callers cannot
        // distinguish a permissions problem from any other failure.
        await expect(walletService.getWalletByUserId('u1'))
            .rejects.toThrow('Failed to retrieve wallet information');
    });
});

describe('transferKori()', () => {
    const twoWallets = (senderBalance = 100) => ({
        tables: { wallets: [
            { data: wallet('w-sender', 'u-sender', senderBalance), error: null },
            { data: wallet('w-receiver', 'u-receiver'), error: null }
        ] }
    });

    it('calls the atomic RPC with both wallet ids in sender -> receiver order', async () => {
        const client = supabaseClient({
            ...twoWallets(),
            rpc: { transfer_kori: { data: 'trx-1', error: null } }
        });
        useClient(client);

        await expect(walletService.transferKori('u-sender', 'u-receiver', 50, 'tip', { note: 'nice chapter' }))
            .resolves.toBe('trx-1');

        const [fnName, params] = client.rpc.mock.calls[0];
        expect(fnName).toBe('transfer_kori');
        // Reversing these two would move money the wrong way.
        expect(params.sender_wallet_id).toBe('w-sender');
        expect(params.receiver_wallet_id).toBe('w-receiver');
        expect(params.transfer_amount).toBe(50);
        expect(params.trx_type).toBe('tip');
        expect(params.trx_metadata).toEqual({ note: 'nice chapter' });
    });

    it('defaults the transaction type to "tip"', async () => {
        const client = supabaseClient({ ...twoWallets(), rpc: { transfer_kori: { data: 'trx-1', error: null } } });
        useClient(client);

        await walletService.transferKori('u-sender', 'u-receiver', 10);

        expect(client.rpc.mock.calls[0][1].trx_type).toBe('tip');
        expect(client.rpc.mock.calls[0][1].trx_metadata).toEqual({});
    });

    it('generates a traceable reference id', async () => {
        const client = supabaseClient({ ...twoWallets(), rpc: { transfer_kori: { data: 'trx-1', error: null } } });
        useClient(client);

        await walletService.transferKori('u-sender', 'u-receiver', 10);

        expect(client.rpc.mock.calls[0][1].trx_reference_id).toMatch(/^KORI-TRX-\d+-[A-Z0-9]+$/);
    });

    it('refuses to call the RPC when the sender has no wallet', async () => {
        const client = supabaseClient({
            tables: { wallets: [
                { data: null, error: PGRST116 },
                { data: wallet('w-receiver', 'u-receiver'), error: null }
            ] },
            rpc: { transfer_kori: { data: 'trx-1', error: null } }
        });
        useClient(client);

        await expect(walletService.transferKori('ghost', 'u-receiver', 50)).rejects.toThrow('Sender wallet not found');
        expect(client.rpc).not.toHaveBeenCalled();
    });

    it('refuses to call the RPC when the receiver has no wallet', async () => {
        const client = supabaseClient({
            tables: { wallets: [
                { data: wallet('w-sender', 'u-sender'), error: null },
                { data: null, error: PGRST116 }
            ] },
            rpc: { transfer_kori: { data: 'trx-1', error: null } }
        });
        useClient(client);

        await expect(walletService.transferKori('u-sender', 'ghost', 50)).rejects.toThrow('Receiver wallet not found');
        // Crediting nobody while debiting the sender would destroy Kori.
        expect(client.rpc).not.toHaveBeenCalled();
    });

    it('propagates the database refusal on insufficient funds', async () => {
        useClient(supabaseClient({
            ...twoWallets(10),
            rpc: { transfer_kori: { data: null, error: { message: 'Insufficient Kori balance' } } }
        }));

        // The balance check lives in Postgres; the service must not soften it.
        await expect(walletService.transferKori('u-sender', 'u-receiver', 5000))
            .rejects.toThrow('Insufficient Kori balance');
    });

    it('falls back to a generic message when the RPC error has none', async () => {
        useClient(supabaseClient({
            ...twoWallets(),
            rpc: { transfer_kori: { data: null, error: { message: '' } } }
        }));

        await expect(walletService.transferKori('u-sender', 'u-receiver', 50)).rejects.toThrow('Transaction failed');
    });

    it('propagates a wallet lookup failure without attempting the transfer', async () => {
        const client = supabaseClient({
            tables: { wallets: [
                { data: null, error: { code: '42501', message: 'permission denied' } },
                { data: wallet('w-receiver', 'u-receiver'), error: null }
            ] },
            rpc: { transfer_kori: { data: 'trx-1', error: null } }
        });
        useClient(client);

        await expect(walletService.transferKori('u-sender', 'u-receiver', 50))
            .rejects.toThrow('Failed to retrieve wallet information');
        expect(client.rpc).not.toHaveBeenCalled();
    });
});

describe('topUpWallet()', () => {
    it('credits the wallet through the top_up_kori RPC and returns the new balance', async () => {
        const client = supabaseClient({
            tables: { wallets: { data: wallet('w1', 'u1'), error: null } },
            rpc: { top_up_kori: { data: 250, error: null } }
        });
        useClient(client);

        await expect(walletService.topUpWallet('u1', 100, 'BKASH-TX-99')).resolves.toBe(250);

        expect(client.rpc).toHaveBeenCalledWith('top_up_kori', {
            target_wallet_id: 'w1',
            topup_amount: 100,
            trx_type: 'purchase',
            // The gateway reference is what makes a top-up idempotent to audit.
            trx_reference_id: 'BKASH-TX-99'
        });
    });

    it('throws and skips the RPC when the wallet does not exist', async () => {
        const client = supabaseClient({
            tables: { wallets: { data: null, error: PGRST116 } },
            rpc: { top_up_kori: { data: 1, error: null } }
        });
        useClient(client);

        await expect(walletService.topUpWallet('ghost', 100, 'REF')).rejects.toThrow('Wallet not found');
        expect(client.rpc).not.toHaveBeenCalled();
    });

    it('propagates an RPC failure', async () => {
        useClient(supabaseClient({
            tables: { wallets: { data: wallet('w1', 'u1'), error: null } },
            rpc: { top_up_kori: { data: null, error: { message: 'duplicate reference id' } } }
        }));

        await expect(walletService.topUpWallet('u1', 100, 'REF')).rejects.toThrow('duplicate reference id');
    });
});
