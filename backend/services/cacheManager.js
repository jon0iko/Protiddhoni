/**
 * Design Pattern: Singleton
 */

class CacheManager {
    constructor() {
        if (CacheManager.instance) {
            return CacheManager.instance;
        }

        this.cache = new Map();
        this.ttl = new Map(); // Time to live for each key
        CacheManager.instance = this;
    }

    set(key, value, ttlSeconds = 3600) {
        // TODO: Implement cache set
        this.cache.set(key, value);
        this.ttl.set(key, Date.now() + (ttlSeconds * 1000));
    }

    get(key) {
        // TODO: Implement cache get with TTL check
        if (!this.cache.has(key)) return null;
        
        const expiry = this.ttl.get(key);
        if (expiry && Date.now() > expiry) {
            this.delete(key);
            return null;
        }
        
        return this.cache.get(key);
    }

    delete(key) {
        // TODO: Implement cache delete
        this.cache.delete(key);
        this.ttl.delete(key);
    }

    clear() {
        // TODO: Implement cache clear
        this.cache.clear();
        this.ttl.clear();
    }
}

const instance = new CacheManager();
Object.freeze(instance);

module.exports = instance;
