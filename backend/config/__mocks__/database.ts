/**
 * Manual mock for config/database.
 *
 * Jest only uses this when a test file calls `jest.mock('../../config/database')`.
 *
 * It exists because the real module is not import-safe under test: it constructs
 * a DatabaseConnection at module scope and throws when SUPABASE_URL /
 * SUPABASE_SERVICE_KEY are missing, and jest.config.ts sets no `setupFiles`. So
 * importing any repository without this mock fails before a single test runs.
 *
 * Pair it with tests/helpers/supabaseMock.ts:
 *
 *     jest.mock('../../config/database');
 *     import { supabaseClient, useClient } from '../helpers/supabaseMock';
 *
 *     useClient(supabaseClient({ tables: { users: { data: [...], error: null } } }));
 *
 * Note the real module freezes its singleton, so `db.getClient` cannot be
 * monkey-patched on the real object -- jest.mock is the only seam.
 */

export default {
    getClient: jest.fn(),
    testConnection: jest.fn(async () => true)
};
