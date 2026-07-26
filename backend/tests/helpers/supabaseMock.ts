/**
 * Shared Supabase query-builder mock.
 *
 * Before this existed there were three incompatible mock shapes across the test
 * suite, and the oldest of them baked the whole call chain into the jest.mock
 * factory -- so results could not vary per test and every assertion degenerated
 * into "the method exists".
 *
 * Four properties keep tests built on this honest:
 *
 *  1. The default result is `{ data: null, error: null }` with NO `count` key.
 *     `count` therefore destructures to `undefined`, which is what actually
 *     exercises the `count || 0` fallbacks in the pagination code.
 *
 *  2. A table or RPC value may be an ARRAY, in which case successive calls get
 *     successive results. Required by anything that queries more than once --
 *     UserRepository.getUserStats (content, follows, follows) and
 *     ContentRepository.findAdvanced (users, content, reviews).
 *
 *  3. An unregistered table or RPC name THROWS, naming the offender. This is the
 *     property that stops these tests being theatre: "the repository queried the
 *     wrong table" becomes a failure instead of a silent pass.
 *
 *  4. Every chain method stays a jest.fn returning the chain, so call-argument
 *     assertions like `expect(chain.eq).toHaveBeenCalledWith('id', x)` still
 *     work -- that is how the filter columns themselves get pinned.
 */

import db from '../../config/database';

export type QueryResult = {
    data?: any;
    error?: any;
    count?: number | null;
};

export type ChainMock = Record<string, any>;

/**
 * Every builder method observed across repositories/ and services/.
 * All of them return the chain, and the chain is thenable at any depth, so both
 * `await q.eq(...)` and `await q.select().eq().single()` resolve to the result.
 */
const CHAIN_METHODS = [
    'select', 'insert', 'update', 'upsert', 'delete',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
    'like', 'ilike', 'is', 'in', 'or', 'not', 'filter', 'contains',
    'order', 'limit', 'range', 'single', 'maybeSingle', 'head', 'returns', 'throwOnError'
];

/** A thenable, chainable query builder that always resolves to `result`. */
export function queryChain(result: QueryResult = { data: null, error: null }): ChainMock {
    const chain: ChainMock = {
        then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject)
    };

    for (const method of CHAIN_METHODS) {
        chain[method] = jest.fn(() => chain);
    }

    return chain;
}

function isChain(value: any): boolean {
    return Boolean(value) && typeof value.then === 'function' && typeof value.select === 'function';
}

function asChain(value: any): ChainMock {
    return isChain(value) ? value : queryChain(value);
}

export type ClientSpec = {
    tables?: Record<string, QueryResult | ChainMock | Array<QueryResult | ChainMock>>;
    rpc?: Record<string, QueryResult | ChainMock | Array<QueryResult | ChainMock>>;
};

/**
 * Build a fake Supabase client whose from()/rpc() dispatch by name.
 *
 * Single value  -> the SAME chain is returned every call, so call history
 *                  accumulates and can be asserted on.
 * Array value   -> one chain per call, in order; exhausting it throws.
 * Unknown name  -> throws.
 */
export function supabaseClient(spec: ClientSpec = {}) {
    const tableSpec = spec.tables ?? {};
    const rpcSpec = spec.rpc ?? {};
    const memo: Record<string, ChainMock> = {};
    const cursor: Record<string, number> = {};

    const resolveEntry = (kind: 'from' | 'rpc', registry: Record<string, any>, name: string): ChainMock => {
        if (!Object.prototype.hasOwnProperty.call(registry, name)) {
            const known = Object.keys(registry).join(', ') || '(none registered)';
            throw new Error(
                `supabaseMock: unexpected ${kind}('${name}'). Registered: ${known}. ` +
                `If this call is expected, add it to the spec; if not, the code under test is hitting the wrong ${kind === 'from' ? 'table' : 'function'}.`
            );
        }

        const entry = registry[name];
        const key = `${kind}:${name}`;

        if (Array.isArray(entry)) {
            const index = cursor[key] ?? 0;
            if (index >= entry.length) {
                throw new Error(
                    `supabaseMock: ${kind}('${name}') called ${index + 1} time(s) but only ${entry.length} result(s) were provided.`
                );
            }
            cursor[key] = index + 1;
            // Materialise each queued entry once so it can still be asserted on.
            const memoKey = `${key}#${index}`;
            memo[memoKey] = memo[memoKey] ?? asChain(entry[index]);
            return memo[memoKey];
        }

        memo[key] = memo[key] ?? asChain(entry);
        return memo[key];
    };

    const from = jest.fn((table: string) => resolveEntry('from', tableSpec, table));
    const rpc = jest.fn((fn: string, _params?: any) => resolveEntry('rpc', rpcSpec, fn));

    return {
        from,
        rpc,
        /** Nth chain handed out for a table -- for asserting on queued results. */
        chainFor(table: string, index = 0): ChainMock {
            return memo[`from:${table}#${index}`] ?? memo[`from:${table}`];
        },
        rpcChainFor(fn: string, index = 0): ChainMock {
            return memo[`rpc:${fn}#${index}`] ?? memo[`rpc:${fn}`];
        }
    };
}

/** Point the mocked db singleton at `client`. Returns it for chaining. */
export function useClient<T>(client: T): T {
    (db.getClient as jest.Mock).mockReturnValue(client);
    return client;
}

/** Convenience: build and install a client in one call. */
export function mockDb(spec: ClientSpec = {}) {
    return useClient(supabaseClient(spec));
}

/** A Supabase "row not found" error, which several repositories treat as null. */
export const PGRST116 = { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' };
