export class CacheService {
    constructor(maxSize = 100) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.accessOrder = new Set();
    }
    get(key) {
        if (this.cache.has(key)) {
            this.updateAccessOrder(key);
            return this.cache.get(key);
        }
        return null;
    }
    set(key, value) {
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            this.evictOldest();
        }
        this.cache.set(key, value);
        this.accessOrder.add(key);
    }
    has(key) {
        return this.cache.has(key);
    }
    delete(key) {
        this.cache.delete(key);
        this.accessOrder.delete(key);
    }
    clear() {
        this.cache.clear();
        this.accessOrder.clear();
    }
    size() {
        return this.cache.size;
    }
    updateAccessOrder(key) {
        this.accessOrder.delete(key);
        this.accessOrder.add(key);
    }
    evictOldest() {
        const oldestKey = this.accessOrder.values().next().value;
        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.accessOrder.delete(oldestKey);
        }
    }
}