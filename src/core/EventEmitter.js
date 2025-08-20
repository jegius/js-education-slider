export class EventEmitter {
    constructor() {
        this.events = new Map();
    }

    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        this.events.get(event).add(callback);

        return () => this.off(event, callback);
    }

    off(event, callback) {
        if (!this.events.has(event)) return;

        this.events.get(event).delete(callback);
    }

    emit(event, data) {
        if (!this.events.has(event)) return;


        this.events.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for ${event}:`, error);
            }
        });
    }

    once(event, callback) {
        const onceWrapper = (data) => {
            callback(data);
            this.off(event, onceWrapper);
        };

        this.on(event, onceWrapper);
    }
}