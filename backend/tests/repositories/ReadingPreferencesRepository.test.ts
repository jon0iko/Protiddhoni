/**
 * ReadingPreferencesRepository.
 *
 * Small file, but createOrUpdate() is a hand-rolled read-then-branch upsert whose
 * two paths build different payloads: the insert injects user_id, the update does
 * not and instead stamps updated_at. Which branch runs depends entirely on
 * findByUser() treating PGRST116 as "absent" rather than throwing.
 */

jest.mock('../../config/database');

import ReadingPreferencesRepository from '../../repositories/ReadingPreferencesRepository';
import { queryChain, mockDb, useClient, supabaseClient, PGRST116 } from '../helpers/supabaseMock';

beforeEach(() => {
    jest.clearAllMocks();
});

describe('findByUser()', () => {
    it('returns the row when present', async () => {
        const row = { user_id: 'u1', theme: 'sepia', font_size: 'large' };
        mockDb({ tables: { reading_preferences: { data: row, error: null } } });

        await expect(ReadingPreferencesRepository.findByUser('u1')).resolves.toEqual(row);
    });

    it('returns null for PGRST116 rather than throwing', async () => {
        mockDb({ tables: { reading_preferences: { data: null, error: PGRST116 } } });
        await expect(ReadingPreferencesRepository.findByUser('u1')).resolves.toBeNull();
    });

    it('rethrows any other error', async () => {
        const err = { code: '42501', message: 'permission denied' };
        mockDb({ tables: { reading_preferences: { data: null, error: err } } });

        await expect(ReadingPreferencesRepository.findByUser('u1')).rejects.toEqual(err);
    });
});

describe('createOrUpdate() -- read-then-branch upsert', () => {
    it('takes the UPDATE path when preferences already exist', async () => {
        const existing = queryChain({ data: { user_id: 'u1', theme: 'light' }, error: null });
        const updated = queryChain({ data: { user_id: 'u1', theme: 'dark' }, error: null });
        useClient(supabaseClient({ tables: { reading_preferences: [existing, updated] } }));

        const result = await ReadingPreferencesRepository.createOrUpdate('u1', { theme: 'dark' });

        expect(result).toEqual({ user_id: 'u1', theme: 'dark' });
        expect(updated.update).toHaveBeenCalled();
        expect(updated.insert).not.toHaveBeenCalled();

        const payload = updated.update.mock.calls[0][0];
        expect(payload.theme).toBe('dark');
        expect(Number.isNaN(Date.parse(payload.updated_at))).toBe(false);
        // The update path scopes by user_id and does NOT re-inject it into the row.
        expect(payload.user_id).toBeUndefined();
        expect(updated.eq).toHaveBeenCalledWith('user_id', 'u1');
    });

    it('takes the INSERT path when none exist, injecting user_id', async () => {
        const absent = queryChain({ data: null, error: PGRST116 });
        const inserted = queryChain({ data: { user_id: 'u1', theme: 'sepia' }, error: null });
        useClient(supabaseClient({ tables: { reading_preferences: [absent, inserted] } }));

        const result = await ReadingPreferencesRepository.createOrUpdate('u1', { theme: 'sepia' });

        expect(result).toEqual({ user_id: 'u1', theme: 'sepia' });
        expect(inserted.insert).toHaveBeenCalledWith({ user_id: 'u1', theme: 'sepia' });
        expect(inserted.update).not.toHaveBeenCalled();
    });

    it('does not stamp updated_at on insert', async () => {
        const absent = queryChain({ data: null, error: PGRST116 });
        const inserted = queryChain({ data: { user_id: 'u1' }, error: null });
        useClient(supabaseClient({ tables: { reading_preferences: [absent, inserted] } }));

        await ReadingPreferencesRepository.createOrUpdate('u1', { theme: 'light' });

        // Insert relies on the column default; only the update path sets it explicitly.
        expect(inserted.insert.mock.calls[0][0].updated_at).toBeUndefined();
    });

    it('propagates an update failure', async () => {
        const existing = queryChain({ data: { user_id: 'u1' }, error: null });
        const failed = queryChain({ data: null, error: { message: 'update failed' } });
        useClient(supabaseClient({ tables: { reading_preferences: [existing, failed] } }));

        await expect(ReadingPreferencesRepository.createOrUpdate('u1', { theme: 'dark' }))
            .rejects.toEqual({ message: 'update failed' });
    });

    it('propagates an insert failure', async () => {
        const absent = queryChain({ data: null, error: PGRST116 });
        const failed = queryChain({ data: null, error: { message: 'insert failed' } });
        useClient(supabaseClient({ tables: { reading_preferences: [absent, failed] } }));

        await expect(ReadingPreferencesRepository.createOrUpdate('u1', { theme: 'dark' }))
            .rejects.toEqual({ message: 'insert failed' });
    });

    it('a hard error on the existence check aborts before any write', async () => {
        const broken = queryChain({ data: null, error: { code: '42501', message: 'permission denied' } });
        useClient(supabaseClient({ tables: { reading_preferences: [broken] } }));

        await expect(ReadingPreferencesRepository.createOrUpdate('u1', { theme: 'dark' })).rejects.toEqual({
            code: '42501', message: 'permission denied'
        });

        // Only one query was consumed -- neither branch ran.
        expect(broken.update).not.toHaveBeenCalled();
        expect(broken.insert).not.toHaveBeenCalled();
    });
});
