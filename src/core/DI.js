class DIContainer {
    constructor() {
        this.services = new Map();
        this.singletons = new Map();
    }
    register(name, factory, options = {}) {
        this.services.set(name, {
            factory,
            singleton: options.singleton || false,
            instance: null
        });
    }
    resolve(name) {
        const service = this.services.get(name);
        if (!service) {
            throw new Error(`Service ${name} not found`);
        }
        if (service.singleton) {
            if (!this.singletons.has(name)) {
                const instance = service.factory(this);
                this.singletons.set(name, instance);
            }
            return this.singletons.get(name);
        }
        return service.factory(this);
    }
    get(name) {
        return this.resolve(name);
    }
}
export const container = new DIContainer();