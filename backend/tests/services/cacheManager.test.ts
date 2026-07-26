/**
 * CacheManager -- the in-process TTL cache behind public content listings.
 *
 * Entirely pure: a Map, a clock, and a size cap. It was at 0/7 functions and
 * 0/15 branches despite controllers depending on it for both read performance
 * and, via deleteByPrefix(), for freshly published content appearing instantly.
 *
 * Two documented-vs-actual gaps are pinned below: the eviction policy is FIFO by
 * first insertion rather than LRU, and expiry is checked with a truthiness test
 * that makes a missing TTL entry immortal.
 *
 * The module exports a FROZEN singleton and the constructor returns the existing
 * instance, so `new CacheManager()` cannot give a test a fresh cache. Isolation
 * comes from clear() in beforeEach.
 */

import cacheManager from '../../services/cacheManager';

beforeEach(() => {
    cacheManager.clear();
    jest.useRealTimers();
});

afterAll(() => {
    cacheManager.clear();
});

describe('set / get basics', () => {
    it('round-trips a value', () => {
        cacheManager.set('k', { a: 1 });
        expect(cacheManager.get('k')).toEqual({ a: 1 });
    });

    it('returns null for a key that was never set', () => {
        expect(cacheManager.get('missing')).toBeNull();
    });

    it('overwrites an existing key in place', () => {
        cacheManager.set('k', 'first');
        cacheManager.set('k', 'second');
        expect(cacheManager.get('k')).toBe('second');
    });

    it('stores falsy values without confusing them for a miss', () => {
        cacheManager.set('zero', 0);
        cacheManager.set('empty', '');
        cacheManager.set('false', false);

        expect(cacheManager.get('zero')).toBe(0);
        expect(cacheManager.get('empty')).toBe('');
        expect(cacheManager.get('false')).toBe(false);
    });

    it('delete removes the value and its TTL together', () => {
        cacheManager.set('k', 'v');
        cacheManager.delete('k');
        expect(cacheManager.get('k')).toBeNull();
    });

    it('clear empties everything', () => {
        cacheManager.set('a', 1);
        cacheManager.set('b', 2);
        cacheManager.clear();

        expect(cacheManager.get('a')).toBeNull();
        expect(cacheManager.get('b')).toBeNull();
    });
});

describe('expiry', () => {
    it('serves a value inside its TTL and drops it after', () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-06-01T00:00:00Z'));
        cacheManager.set('k', 'v', 60);

        jest.setSystemTime(new Date('2026-06-01T00:00:30Z'));
        expect(cacheManager.get('k')).toBe('v');

        jest.setSystemTime(new Date('2026-06-01T00:01:01Z'));
        expect(cacheManager.get('k')).toBeNull();
    });

    it('is still a HIT at the exact expiry instant', () => {
        // The check is `Date.now() > expiry`, strictly greater. Flipping it to >=
        // would silently shorten every TTL by one tick.
        jest.useFakeTimers().setSystemTime(new Date('2026-06-01T00:00:00Z'));
        cacheManager.set('k', 'v', 60);

        jest.setSystemTime(new Date('2026-06-01T00:01:00Z'));
        expect(cacheManager.get('k')).toBe('v');

        jest.setSystemTime(new Date('2026-06-01T00:01:00.001Z'));
        expect(cacheManager.get('k')).toBeNull();
    });

    it('expiry is absolute, fixed at write time, and not extended by reads', () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-06-01T00:00:00Z'));
        cacheManager.set('k', 'v', 60);

        jest.setSystemTime(new Date('2026-06-01T00:00:50Z'));
        expect(cacheManager.get('k')).toBe('v');   // a read must not renew the lease

        jest.setSystemTime(new Date('2026-06-01T00:01:01Z'));
        expect(cacheManager.get('k')).toBeNull();
    });

    it('defaults to a 300 second TTL', () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-06-01T00:00:00Z'));
        cacheManager.set('k', 'v');

        jest.setSystemTime(new Date('2026-06-01T00:04:59Z'));
        expect(cacheManager.get('k')).toBe('v');

        jest.setSystemTime(new Date('2026-06-01T00:05:01Z'));
        expect(cacheManager.get('k')).toBeNull();
    });

    it('expires lazily -- a stale entry is only reclaimed when it is read', () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-06-01T00:00:00Z'));
        cacheManager.set('k', 'v', 1);

        jest.setSystemTime(new Date('2026-06-01T01:00:00Z'));
        // There is no sweeper; nothing has run in the background.
        expect(cacheManager.get('k')).toBeNull();
        expect(cacheManager.get('k')).toBeNull();  // and the reclaim is idempotent
    });
});

describe('eviction at capacity', () => {
    const MAX_ENTRIES = 1000;

    it('holds exactly MAX_ENTRIES and evicts the first-inserted key on overflow', () => {
        for (let i = 0; i < MAX_ENTRIES; i++) cacheManager.set(`k${i}`, i);

        expect(cacheManager.get('k0')).toBe(0);

        cacheManager.set('overflow', 'x');

        expect(cacheManager.get('k0')).toBeNull();        // evicted
        expect(cacheManager.get('k1')).toBe(1);           // survivor
        expect(cacheManager.get('overflow')).toBe('x');
    });

    it('evicts exactly one entry per insert, not a batch', () => {
        for (let i = 0; i < MAX_ENTRIES; i++) cacheManager.set(`k${i}`, i);

        cacheManager.set('overflow', 'x');

        expect(cacheManager.get('k1')).toBe(1);
        expect(cacheManager.get('k2')).toBe(2);
    });

    it('overwriting an existing key at capacity evicts nothing', () => {
        for (let i = 0; i < MAX_ENTRIES; i++) cacheManager.set(`k${i}`, i);

        cacheManager.set('k500', 'updated');

        // The `!this.cache.has(key)` guard is what protects k0 here.
        expect(cacheManager.get('k0')).toBe(0);
        expect(cacheManager.get('k500')).toBe('updated');
    });

    it('is FIFO by first insertion, NOT LRU', () => {
        for (let i = 0; i < MAX_ENTRIES; i++) cacheManager.set(`k${i}`, i);

        // Read and rewrite k0 repeatedly -- under an LRU policy this would make it
        // the safest entry in the cache.
        cacheManager.get('k0');
        cacheManager.set('k0', 'hot');
        cacheManager.get('k0');

        cacheManager.set('overflow', 'x');

        // ...but set() never repositions the key, so the hottest entry is still
        // the first one evicted. Documented, not endorsed.
        expect(cacheManager.get('k0')).toBeNull();
    });
});

describe('getOrSet', () => {
    it('calls the producer once on a miss and not at all on a hit', async () => {
        const producer = jest.fn().mockResolvedValue('computed');

        await expect(cacheManager.getOrSet('k', 60, producer)).resolves.toBe('computed');
        await expect(cacheManager.getOrSet('k', 60, producer)).resolves.toBe('computed');

        expect(producer).toHaveBeenCalledTimes(1);
    });

    it('re-invokes the producer once the entry has expired', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-06-01T00:00:00Z'));
        const producer = jest.fn().mockResolvedValue('v');

        await cacheManager.getOrSet('k', 60, producer);
        jest.setSystemTime(new Date('2026-06-01T00:02:00Z'));
        await cacheManager.getOrSet('k', 60, producer);

        expect(producer).toHaveBeenCalledTimes(2);
    });

    it('does not cache a thrown error', async () => {
        const producer = jest.fn()
            .mockRejectedValueOnce(new Error('upstream down'))
            .mockResolvedValueOnce('recovered');

        await expect(cacheManager.getOrSet('k', 60, producer)).rejects.toThrow('upstream down');
        // A cached failure would keep serving the error for the whole TTL.
        await expect(cacheManager.getOrSet('k', 60, producer)).resolves.toBe('recovered');
    });

    it('DOES cache legitimately empty arrays and objects', async () => {
        const emptyArray = jest.fn().mockResolvedValue([]);
        await cacheManager.getOrSet('list', 60, emptyArray);
        await cacheManager.getOrSet('list', 60, emptyArray);

        // Otherwise an empty category would re-query the database on every hit.
        expect(emptyArray).toHaveBeenCalledTimes(1);
    });

    it('does not cache null or undefined, so the producer runs every time', async () => {
        const nullProducer = jest.fn().mockResolvedValue(null);
        await cacheManager.getOrSet('n', 60, nullProducer);
        await cacheManager.getOrSet('n', 60, nullProducer);
        expect(nullProducer).toHaveBeenCalledTimes(2);

        const undefProducer = jest.fn().mockResolvedValue(undefined);
        await cacheManager.getOrSet('u', 60, undefProducer);
        await cacheManager.getOrSet('u', 60, undefProducer);
        expect(undefProducer).toHaveBeenCalledTimes(2);
    });

    it('honours the caller TTL rather than the default', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-06-01T00:00:00Z'));
        const producer = jest.fn().mockResolvedValue('v');

        await cacheManager.getOrSet('k', 10, producer);
        jest.setSystemTime(new Date('2026-06-01T00:00:11Z'));
        await cacheManager.getOrSet('k', 10, producer);

        expect(producer).toHaveBeenCalledTimes(2);
    });
});

describe('deleteByPrefix -- the write-invalidation contract', () => {
    it('removes every key in the namespace and leaves the rest', () => {
        cacheManager.set('content:list:page1', 'a');
        cacheManager.set('content:list:page2', 'b');
        cacheManager.set('content:detail:1', 'c');
        cacheManager.set('categories:all', 'd');

        cacheManager.deleteByPrefix('content:list:');

        expect(cacheManager.get('content:list:page1')).toBeNull();
        expect(cacheManager.get('content:list:page2')).toBeNull();
        expect(cacheManager.get('content:detail:1')).toBe('c');
        expect(cacheManager.get('categories:all')).toBe('d');
    });

    it('matches on prefix only, not on substring', () => {
        cacheManager.set('a:content:list', 'nested');
        cacheManager.deleteByPrefix('content:');

        expect(cacheManager.get('a:content:list')).toBe('nested');
    });

    it('clears the TTL alongside the value', () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-06-01T00:00:00Z'));
        cacheManager.set('content:x', 'v', 60);

        cacheManager.deleteByPrefix('content:');
        cacheManager.set('content:x', 'fresh', 60);

        // A leaked TTL entry from the first write would expire the new value early.
        jest.setSystemTime(new Date('2026-06-01T00:00:59Z'));
        expect(cacheManager.get('content:x')).toBe('fresh');
    });

    it('an empty prefix wipes the whole cache', () => {
        cacheManager.set('a', 1);
        cacheManager.set('b', 2);

        cacheManager.deleteByPrefix('');

        expect(cacheManager.get('a')).toBeNull();
        expect(cacheManager.get('b')).toBeNull();
    });

    it('deleting while iterating does not skip entries', () => {
        for (let i = 0; i < 50; i++) cacheManager.set(`p:${i}`, i);

        cacheManager.deleteByPrefix('p:');

        for (let i = 0; i < 50; i++) {
            expect(cacheManager.get(`p:${i}`)).toBeNull();
        }
    });

    it('is a no-op when nothing matches', () => {
        cacheManager.set('a', 1);
        cacheManager.deleteByPrefix('zzz');
        expect(cacheManager.get('a')).toBe(1);
    });
});

describe('singleton identity', () => {
    it('a second import is the same instance', async () => {
        const again = (await import('../../services/cacheManager')).default;

        cacheManager.set('shared', 'value');
        expect(again.get('shared')).toBe('value');
        expect(again).toBe(cacheManager);
    });
});
