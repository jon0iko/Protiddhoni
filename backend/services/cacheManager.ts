/**
 * Design Pattern: Singleton
 *
 * In-process TTL cache for hot, read-heavy, non-personalized data (public
 * content lists, category lists). Goals:
 *   - Cut repeated Supabase round-trips (the main variable cost at scale).
 *   - Stay memory-safe: entries expire on a TTL and the map is size-capped with
 *     simple oldest-first eviction, so it can never grow unbounded.
 *   - Support instant invalidation: writers call deleteByPrefix() so freshly
 *     published/edited content is picked up by clients immediately, not after
 *     the TTL elapses.
 *
 * NOTE: this is per-process. With multiple horizontally-scaled instances each
 * keeps its own copy (still correct because of the short TTL + explicit
 * invalidation on writes). Swap the internals for Redis if you later need a
 * shared cache across instances — the public API here is intentionally small so
 * that change stays localized.
 */

const MAX_ENTRIES = 1000;

class CacheManager {
    private static instance: CacheManager | undefined;
    private cache!: Map<string, any>;
    private ttl!: Map<string, number>;

    constructor() {
        if (CacheManager.instance) {
            return CacheManager.instance;
        }

        this.cache = new Map();
        this.ttl = new Map(); // key -> expiry timestamp (ms)
        CacheManager.instance = this;
    }

    set(key, value, ttlSeconds = 300) {
        // Evict the oldest entry when at capacity (Map preserves insertion order).
        if (!this.cache.has(key) && this.cache.size >= MAX_ENTRIES) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey !== undefined) {
                this.delete(oldestKey);
            }
        }

        this.cache.set(key, value);
        this.ttl.set(key, Date.now() + ttlSeconds * 1000);
    }

    get(key) {
        if (!this.cache.has(key)) return null;

        const expiry = this.ttl.get(key);
        if (expiry && Date.now() > expiry) {
            this.delete(key);
            return null;
        }

        return this.cache.get(key);
    }

    /**
     * Return the cached value for `key`, or compute it via `producer()`, store
     * it, and return it. `producer` is only awaited on a miss. Errors are not
     * cached.
     */
    async getOrSet(key, ttlSeconds, producer) {
        const cached = this.get(key);
        if (cached !== null) {
            return cached;
        }

        const value = await producer();
        // Never cache empty/failed results as a truthy hit surprise; still cache
        // legitimately empty arrays/objects so list endpoints don't thrash.
        if (value !== undefined && value !== null) {
            this.set(key, value, ttlSeconds);
        }
        return value;
    }

    delete(key) {
        this.cache.delete(key);
        this.ttl.delete(key);
    }

    /**
     * Invalidate every entry whose key starts with `prefix`. Used by writers to
     * flush a whole namespace (e.g. 'content:list:') the moment content is
     * published or edited, so readers see the change instantly.
     */
    deleteByPrefix(prefix) {
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.delete(key);
            }
        }
    }

    clear() {
        this.cache.clear();
        this.ttl.clear();
    }
}

const instance = new CacheManager();
Object.freeze(instance);

export default instance;
