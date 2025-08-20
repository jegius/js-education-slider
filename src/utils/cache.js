export class Cache {
    constructor(maxSize = 100) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.accessOrder = new Set();
    }

    get(key) {
        if (this.cache.has(key)) {
            // Обновляем порядок доступа
            this.accessOrder.delete(key);
            this.accessOrder.add(key);
            return this.cache.get(key);
        }
        return null;
    }

    set(key, value) {
        // Если кэш переполнен, удаляем самый старый элемент
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            const oldestKey = this.accessOrder.values().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
                this.accessOrder.delete(oldestKey);
            }
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
}