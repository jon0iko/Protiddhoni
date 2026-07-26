/**
 * UserRepository -- data access for users and the follow graph.
 *
 * This file started at literally 0 covered statements, which mattered more than
 * the number suggested: findLegacyUsernameWithPassword() selects '*' and so
 * returns the password hash, and getUserStats()/getFollowers()/getFollowing()
 * encode the direction of the social graph in a pair of near-identical column
 * names that a refactor can silently invert.
 */

jest.mock('../../config/database');

import UserRepository from '../../repositories/UserRepository';
import { queryChain, mockDb, useClient, supabaseClient, PGRST116 } from '../helpers/supabaseMock';

// findByUsername logs on every call; keep the suite output readable.
beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterAll(() => {
    (console.log as jest.Mock).mockRestore?.();
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe('findLegacyUsernameWithPassword() -- legacy username recovery', () => {
    /**
     * Usernames were once suffixed with 8 hex characters. This method finds the
     * single legacy row for a base username. It returns the FULL row including
     * password_hash, so both the matching rule and the ambiguity rule are
     * security properties, not cosmetics.
     */
    const legacyRow = (username: string) => ({ id: `id-${username}`, username, password_hash: 'hashed' });

    it('returns the row when exactly one candidate has an 8-hex suffix', async () => {
        const chain = queryChain({ data: [legacyRow('rumi-1a2b3c4d')], error: null });
        useClient(supabaseClient({ tables: { users: chain } }));

        const result = await UserRepository.findLegacyUsernameWithPassword('rumi');

        expect(result).toEqual(legacyRow('rumi-1a2b3c4d'));
        // The prefix search must be anchored to the base name.
        expect(chain.like).toHaveBeenCalledWith('username', 'rumi-%');
    });

    it('rejects a 7-hex suffix (too short)', async () => {
        useClient(supabaseClient({ tables: { users: { data: [legacyRow('rumi-1a2b3c4')], error: null } } }));
        await expect(UserRepository.findLegacyUsernameWithPassword('rumi')).resolves.toBeNull();
    });

    it('rejects a 9-hex suffix (too long)', async () => {
        useClient(supabaseClient({ tables: { users: { data: [legacyRow('rumi-1a2b3c4d5')], error: null } } }));
        await expect(UserRepository.findLegacyUsernameWithPassword('rumi')).resolves.toBeNull();
    });

    it('rejects a non-hex suffix and uppercase hex', async () => {
        useClient(supabaseClient({
            tables: { users: { data: [legacyRow('rumi-1a2b3c4g'), legacyRow('rumi-1A2B3C4D')], error: null } }
        }));
        await expect(UserRepository.findLegacyUsernameWithPassword('rumi')).resolves.toBeNull();
    });

    it('fails closed when two candidates match -- ambiguity must not resolve to a user', async () => {
        useClient(supabaseClient({
            tables: { users: { data: [legacyRow('rumi-1a2b3c4d'), legacyRow('rumi-9f8e7d6c')], error: null } }
        }));

        // Returning either row here would hand out a password hash on a guess.
        await expect(UserRepository.findLegacyUsernameWithPassword('rumi')).resolves.toBeNull();
    });

    it('escapes regex metacharacters in the base username', async () => {
        // Unescaped, `a.b` would compile to /^a.b-[a-f0-9]{8}$/ and `.` would
        // match any character, so `axb-1a2b3c4d` would be accepted as `a.b`.
        useClient(supabaseClient({ tables: { users: { data: [legacyRow('axb-1a2b3c4d')], error: null } } }));

        await expect(UserRepository.findLegacyUsernameWithPassword('a.b')).resolves.toBeNull();
    });

    it('matches the literal base name when it contains metacharacters', async () => {
        useClient(supabaseClient({ tables: { users: { data: [legacyRow('a.b-1a2b3c4d')], error: null } } }));

        const result = await UserRepository.findLegacyUsernameWithPassword('a.b');
        expect(result?.username).toBe('a.b-1a2b3c4d');
    });

    it('returns null on a query error, an empty result, or a null result', async () => {
        useClient(supabaseClient({ tables: { users: { data: null, error: { message: 'boom' } } } }));
        await expect(UserRepository.findLegacyUsernameWithPassword('rumi')).resolves.toBeNull();

        useClient(supabaseClient({ tables: { users: { data: [], error: null } } }));
        await expect(UserRepository.findLegacyUsernameWithPassword('rumi')).resolves.toBeNull();

        useClient(supabaseClient({ tables: { users: { data: null, error: null } } }));
        await expect(UserRepository.findLegacyUsernameWithPassword('rumi')).resolves.toBeNull();
    });
});

describe('getUserStats() -- follow-graph direction', () => {
    it('counts published content, followers and following from the right columns', async () => {
        const contentChain = queryChain({ data: null, error: null, count: 7 });
        const followersChain = queryChain({ data: null, error: null, count: 12 });
        const followingChain = queryChain({ data: null, error: null, count: 3 });

        useClient(supabaseClient({
            tables: { content: contentChain, follows: [followersChain, followingChain] }
        }));

        const stats = await UserRepository.getUserStats('user-1');

        expect(stats).toEqual({ contentCount: 7, followerCount: 12, followingCount: 3 });

        // Content is filtered to published only -- drafts must not inflate the count.
        expect(contentChain.eq).toHaveBeenCalledWith('author_id', 'user-1');
        expect(contentChain.eq).toHaveBeenCalledWith('is_published', true);

        // The two follows queries differ ONLY by column, and swapping them would
        // silently reverse every follower/following count in the product.
        expect(followersChain.eq).toHaveBeenCalledWith('following_id', 'user-1');
        expect(followingChain.eq).toHaveBeenCalledWith('follower_id', 'user-1');
    });

    it('reports zero when a count comes back null', async () => {
        useClient(supabaseClient({
            tables: {
                content: { data: null, error: null, count: null },
                follows: [{ data: null, error: null }, { data: null, error: null }]
            }
        }));

        await expect(UserRepository.getUserStats('user-1')).resolves.toEqual({
            contentCount: 0, followerCount: 0, followingCount: 0
        });
    });

    it('KNOWN GAP: a failed query is indistinguishable from a genuine zero', async () => {
        // getUserStats never destructures `error`, so a broken query reports 0
        // rather than surfacing. Pinned deliberately: if someone adds error
        // handling this test should fail and be updated, not silently drift.
        useClient(supabaseClient({
            tables: {
                content: { data: null, error: { message: 'db down' }, count: null },
                follows: [
                    { data: null, error: { message: 'db down' }, count: null },
                    { data: null, error: { message: 'db down' }, count: null }
                ]
            }
        }));

        await expect(UserRepository.getUserStats('user-1')).resolves.toEqual({
            contentCount: 0, followerCount: 0, followingCount: 0
        });
    });
});

describe('getFollowers() / getFollowing() -- embed unwrapping', () => {
    const alice = { id: 'u-a', username: 'alice', full_name: 'Alice', profile_picture_url: null, bio: null };
    const bob = { id: 'u-b', username: 'bob', full_name: 'Bob', profile_picture_url: null, bio: null };

    it('getFollowers unwraps the `follower` embed and filters on following_id', async () => {
        const chain = queryChain({ data: [{ follower: alice }, { follower: bob }], error: null });
        useClient(supabaseClient({ tables: { follows: chain } }));

        await expect(UserRepository.getFollowers('user-1')).resolves.toEqual([alice, bob]);
        expect(chain.eq).toHaveBeenCalledWith('following_id', 'user-1');
    });

    it('getFollowing unwraps the `following` embed and filters on follower_id', async () => {
        const chain = queryChain({ data: [{ following: bob }], error: null });
        useClient(supabaseClient({ tables: { follows: chain } }));

        await expect(UserRepository.getFollowing('user-1')).resolves.toEqual([bob]);
        expect(chain.eq).toHaveBeenCalledWith('follower_id', 'user-1');
    });

    it('both throw when the query errors', async () => {
        mockDb({ tables: { follows: { data: null, error: { message: 'boom' } } } });
        await expect(UserRepository.getFollowers('user-1')).rejects.toEqual({ message: 'boom' });

        mockDb({ tables: { follows: { data: null, error: { message: 'boom' } } } });
        await expect(UserRepository.getFollowing('user-1')).rejects.toEqual({ message: 'boom' });
    });

    it('KNOWN GAP: a null data payload throws TypeError instead of returning []', async () => {
        // Unlike CommentRepository.findByContentId, these two have no `data ||[]`
        // guard. Recorded so the crash is a known behaviour rather than a surprise.
        mockDb({ tables: { follows: { data: null, error: null } } });
        await expect(UserRepository.getFollowers('user-1')).rejects.toThrow(TypeError);
    });
});

describe('isFollowing()', () => {
    it('is true when a row exists and false when it does not', async () => {
        mockDb({ tables: { follows: { data: { id: 'follow-1' }, error: null } } });
        await expect(UserRepository.isFollowing('a', 'b')).resolves.toBe(true);

        mockDb({ tables: { follows: { data: null, error: PGRST116 } } });
        await expect(UserRepository.isFollowing('a', 'b')).resolves.toBe(false);
    });

    it('filters on both endpoints of the edge', async () => {
        const chain = queryChain({ data: { id: 'follow-1' }, error: null });
        useClient(supabaseClient({ tables: { follows: chain } }));

        await UserRepository.isFollowing('follower-1', 'following-1');

        expect(chain.eq).toHaveBeenCalledWith('follower_id', 'follower-1');
        expect(chain.eq).toHaveBeenCalledWith('following_id', 'following-1');
    });
});

describe('error contract -- reads return null, writes throw', () => {
    const reads: Array<[string, () => Promise<any>]> = [
        ['findById', () => UserRepository.findById('x')],
        ['findByEmail', () => UserRepository.findByEmail('x@example.com')],
        ['findByEmailWithPassword', () => UserRepository.findByEmailWithPassword('x@example.com')],
        ['findByUsername', () => UserRepository.findByUsername('x')],
        ['findByUsernameWithPassword', () => UserRepository.findByUsernameWithPassword('x')]
    ];

    it.each(reads)('%s returns null on error rather than throwing', async (_name, call) => {
        mockDb({ tables: { users: { data: null, error: PGRST116 } } });
        await expect(call()).resolves.toBeNull();
    });

    it('create() and update() throw on error', async () => {
        mockDb({ tables: { users: { data: null, error: { message: 'duplicate key' } } } });
        await expect(UserRepository.create({ email: 'a@b.c' })).rejects.toEqual({ message: 'duplicate key' });

        mockDb({ tables: { users: { data: null, error: { message: 'duplicate key' } } } });
        await expect(UserRepository.update('u1', { bio: 'hi' })).rejects.toEqual({ message: 'duplicate key' });
    });

    it('delete() and unfollow() resolve true on success and throw on error', async () => {
        mockDb({ tables: { users: { data: null, error: null } } });
        await expect(UserRepository.delete('u1')).resolves.toBe(true);

        mockDb({ tables: { follows: { data: null, error: null } } });
        await expect(UserRepository.unfollow('a', 'b')).resolves.toBe(true);

        mockDb({ tables: { follows: { data: null, error: { message: 'boom' } } } });
        await expect(UserRepository.unfollow('a', 'b')).rejects.toEqual({ message: 'boom' });
    });
});

describe('write shaping', () => {
    it('update() stamps updated_at and preserves the caller fields', async () => {
        const chain = queryChain({ data: { id: 'u1' }, error: null });
        useClient(supabaseClient({ tables: { users: chain } }));

        await UserRepository.update('u1', { bio: 'new bio' });

        const payload = chain.update.mock.calls[0][0];
        expect(payload.bio).toBe('new bio');
        expect(typeof payload.updated_at).toBe('string');
        expect(Number.isNaN(Date.parse(payload.updated_at))).toBe(false);
    });

    it('follow() inserts the edge in follower -> following order', async () => {
        const chain = queryChain({ data: { id: 'f1' }, error: null });
        useClient(supabaseClient({ tables: { follows: chain } }));

        await UserRepository.follow('follower-1', 'following-1');

        expect(chain.insert).toHaveBeenCalledWith({
            follower_id: 'follower-1',
            following_id: 'following-1'
        });
    });
});

describe('table routing', () => {
    it('queries `users`, not some other table', async () => {
        const client = supabaseClient({ tables: { users: { data: { id: 'u1' }, error: null } } });
        useClient(client);

        await UserRepository.findById('u1');

        expect(client.from).toHaveBeenCalledWith('users');
    });

    it('the mock rejects an unregistered table, so a wrong-table regression fails loudly', async () => {
        useClient(supabaseClient({ tables: { users: { data: null, error: null } } }));
        // getUserStats hits `content` and `follows`, neither registered above.
        await expect(UserRepository.getUserStats('u1')).rejects.toThrow(/unexpected from\('content'\)/);
    });
});
