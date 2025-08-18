export class NavigationService {
    constructor() {
        this.currentIndex = 0;
        this.slides = [];
        this.operationQueue = [];
        this.isProcessing = false;
        this.maxConcurrentOperations = 1;
        this.stateChangeCallbacks = [];
    }

    getCurrentIndex() {
        return this.currentIndex;
    }

    getSlides() {
        return this.slides;
    }

    setSlides(slides) {
        this.slides = slides || [];
    }

    canGoPrev() {
        return this.currentIndex > 0;
    }

    canGoNext(hasMore = true) {
        return this.currentIndex < this.slides.length - 1 || hasMore;
    }

    // Более мягкая проверка границ с возможностью установки на последний доступный индекс
    async setCurrentIndex(index) {
        // Если индекс отрицательный, устанавливаем на 0
        if (index < 0) {
            index = 0;
        }

        // Если индекс больше или равен длине массива, устанавливаем на последний элемент
        if (this.slides.length > 0 && index >= this.slides.length) {
            index = this.slides.length - 1;
        }

        // Если слайдов нет, индекс остается 0
        if (this.slides.length === 0) {
            index = 0;
        }

        const oldIndex = this.currentIndex;
        this.currentIndex = index;

        // Уведомляем всех подписчиков асинхронно
        const callbacks = [...this.stateChangeCallbacks];
        await Promise.all(
            callbacks.map(callback =>
                Promise.resolve().then(() => callback(index, oldIndex))
            ).map(promise =>
                promise.catch(error =>
                    console.error('Error in state change callback:', error)
                )
            )
        );

        return true;
    }

    // Подписка на изменения состояния
    onStateChange(callback) {
        this.stateChangeCallbacks.push(callback);
        return () => {
            const index = this.stateChangeCallbacks.indexOf(callback);
            if (index > -1) {
                this.stateChangeCallbacks.splice(index, 1);
            }
        };
    }

    // Управление очередью операций
    async executeOperation(operation) {
        return new Promise((resolve, reject) => {
            if (this.operationQueue.length > 10) {
                console.warn('Operation queue is too long, clearing oldest operations');
                this.operationQueue = this.operationQueue.slice(-5);
            }

            this.operationQueue.push({ operation, resolve, reject });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.isProcessing || this.operationQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.operationQueue.length > 0) {
            const { operation, resolve, reject } = this.operationQueue.shift();

            try {
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Operation timeout')), 10000);
                });

                const result = await Promise.race([
                    operation(),
                    timeoutPromise
                ]);

                resolve(result);
            } catch (error) {
                console.error('Error in navigation operation:', error);
                reject(error);
            }

            await new Promise(resolve => setTimeout(resolve, 10));
        }

        this.isProcessing = false;
    }

    clearQueue() {
        this.operationQueue = [];
        this.isProcessing = false;
    }
}