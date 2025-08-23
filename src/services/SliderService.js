import { apiService } from './api.js';
import { EventEmitter } from '@/core/EventEmitter.js';
export class SliderService {
    constructor() {
        this.eventEmitter = new EventEmitter();
        try {
            this.cacheService = window.container.resolve('CacheService');
            this.navigationService = window.container.resolve('NavigationService');
            this.templateService = window.container.resolve('TemplateService');
        } catch (error) {
            console.error('Failed to resolve dependencies:', error);
            throw new Error('SliderService dependencies not available');
        }
        this.isLoading = false;
        this.hasMore = true;
        this.initialized = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.pendingOperations = new Set();
        this.slideDataMap = new Map();
    }
    on(event, callback) {
        return this.eventEmitter.on(event, callback);
    }
    off(event, callback) {
        this.eventEmitter.off(event, callback);
    }
    emit(event, data) {
        this.eventEmitter.emit(event, data);
    }
    once(event, callback) {
        this.eventEmitter.once(event, callback);
    }
    setSlideData(slideData) {
        if (!slideData || slideData.id == null) {
            console.error('Invalid slide data provided to setSlideData', slideData);
            return;
        }
        const slideId = slideData.id;
        const isNew = !this.slideDataMap.has(slideId);
        this.slideDataMap.set(slideId, slideData);
        this.emit('slideDataChanged', { slideId, slideData, isNew });
    }
    getSlideData(slideId) {
        return this.slideDataMap.get(slideId) || null;
    }
    observeSlideData(slideId) {
        return (callback) => {
            const handler = (data) => {
                if (data.slideId === slideId) {
                    callback(data.slideData);
                }
            };
            const unsubscribe = this.on('slideDataChanged', handler);
            const currentData = this.getSlideData(slideId);
            if (currentData) {
                queueMicrotask(() => {
                    if (this.slideDataMap.has(slideId)) {
                        callback(currentData);
                    }
                });
            }
            return unsubscribe;
        };
    }
    async loadSlides(offset = 0, limit = 10) {
        const cacheKey = `slides_${offset}_${limit}`;
        if (this.cacheService.has(cacheKey)) {
            const cachedSlides = this.cacheService.get(cacheKey);
            cachedSlides.forEach(slide => this.setSlideData(slide));
            return cachedSlides;
        }
        try {
            const slides = await apiService.fetchSlides(offset, limit);
            slides.forEach(slide => this.setSlideData(slide));
            this.cacheService.set(cacheKey, slides);
            this.retryCount = 0;
            return slides;
        } catch (error) {
            console.error('Error loading slides:', error);
            throw error;
        }
    }
    async initialize() {
        if (this.initialized) return;
        try {
            const slides = await this.loadSlides(0, 5);
            this.navigationService.setSlides(slides);
            await this.navigationService.setCurrentIndex(0);
            this.initialized = true;
            this.retryCount = 0;
            this.emit('slidesChanged', slides);
            this.emit('indexChanged', 0);
        } catch (error) {
            console.error('Error initializing slider service:', error);
            this.retryCount++;
            if (this.retryCount <= this.maxRetries) {
                console.log(`Retry ${this.retryCount}/${this.maxRetries} initialization...`);
                setTimeout(() => {
                    this.initialize().catch(err => {
                        console.error('Final initialization error:', err);
                        this.emit('initializationError', err);
                    });
                }, 1000 * this.retryCount);
            } else {
                this.emit('initializationError', error);
                throw error;
            }
        }
    }
    getSlides() {
        return this.navigationService.getSlides();
    }
    getCurrentIndex() {
        return this.navigationService.getCurrentIndex();
    }
    async goToSlide(index) {
        const operationId = Symbol('goToSlide');
        this.pendingOperations.add(operationId);
        try {
            const slides = this.navigationService.getSlides();
            if (index < 0) return false;
            if (index >= slides.length) {
                if (this.hasMore && !this.isLoading) {
                    try {
                        const newSlides = await this.loadMoreSlides(slides, 5);
                        this.navigationService.setSlides(newSlides);
                        this.emit('slidesChanged', newSlides);
                        if (index < newSlides.length) {
                            await this.navigationService.setCurrentIndex(index);
                            this.emit('indexChanged', index);
                            this.retryCount = 0;
                            return true;
                        } else {
                            const lastIndex = newSlides.length - 1;
                            if (lastIndex >= 0) {
                                await this.navigationService.setCurrentIndex(lastIndex);
                                this.emit('indexChanged', lastIndex);
                            }
                            return false;
                        }
                    } catch (error) {
                        console.error('Error loading slides:', error);
                        return false;
                    }
                }
                return false;
            }
            await this.navigationService.setCurrentIndex(index);
            this.emit('indexChanged', index);
            return true;
        } finally {
            this.pendingOperations.delete(operationId);
        }
    }
    async nextSlide() {
        const operationId = Symbol('nextSlide');
        this.pendingOperations.add(operationId);
        try {
            const slides = this.navigationService.getSlides();
            const currentIndex = this.navigationService.getCurrentIndex();
            const nextIndex = currentIndex + 1;
            if (nextIndex >= slides.length - 2 && this.hasMore && !this.isLoading) {
                this.loadMoreSlides(slides, 5).then(newSlides => {
                    this.navigationService.setSlides(newSlides);
                    this.emit('slidesChanged', newSlides);
                }).catch(err => console.error('Prefetch error:', err));
            }
            if (nextIndex < slides.length) {
                await this.navigationService.setCurrentIndex(nextIndex);
                this.emit('indexChanged', nextIndex);
                return { slides: null, index: nextIndex };
            }
            if (this.hasMore && !this.isLoading) {
                const newSlides = await this.loadMoreSlides(slides, 5);
                this.navigationService.setSlides(newSlides);
                this.emit('slidesChanged', newSlides);
                if (nextIndex < newSlides.length) {
                    await this.navigationService.setCurrentIndex(nextIndex);
                    this.emit('indexChanged', nextIndex);
                }
            }
            return { slides, index: this.navigationService.getCurrentIndex() };
        } finally {
            this.pendingOperations.delete(operationId);
        }
    }
    async prevSlide() {
        const operationId = Symbol('prevSlide');
        this.pendingOperations.add(operationId);
        try {
            const currentIndex = this.navigationService.getCurrentIndex();
            if (currentIndex > 0) {
                await this.navigationService.setCurrentIndex(currentIndex - 1);
                this.emit('indexChanged', currentIndex - 1);
                return true;
            }
            return false;
        } finally {
            this.pendingOperations.delete(operationId);
        }
    }
    async loadMoreSlides(currentSlides, limit = 5) {
        if (this.isLoading || !this.hasMore) return currentSlides;
        const operationId = Symbol('loadMoreSlides');
        this.pendingOperations.add(operationId);
        this.isLoading = true;
        this.emit('loading', true);
        try {
            const offset = currentSlides.length;
            const newSlides = await this.loadSlides(offset, limit);
            if (newSlides.length === 0) {
                this.hasMore = false;
                this.emit('hasMoreChanged', false);
            }
            const allSlides = [...currentSlides, ...newSlides];
            this.retryCount = 0;
            return allSlides;
        } catch (error) {
            console.error('Error loading more slides:', error);
            this.retryCount++;
            if (this.retryCount <= this.maxRetries) {
                console.log(`Retry ${this.retryCount}/${this.maxRetries} loading more slides...`);
                try {
                    await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
                    const result = await this.loadMoreSlides(currentSlides, limit);
                    this.retryCount = 0;
                    return result;
                } catch (retryError) {
                }
            }
            return currentSlides;
        } finally {
            this.pendingOperations.delete(operationId);
            if (this.pendingOperations.size === 0) {
                this.isLoading = false;
                this.emit('loading', false);
            }
        }
    }
    registerTemplate(name, templateFunction) {
        this.templateService.registerTemplate(name, templateFunction);
        this.emit('templateRegistered', { name, templateFunction });
    }
    getTemplate(name) {
        return this.templateService.getTemplate(name);
    }
    isLoadingState() {
        return this.isLoading;
    }
    hasMoreSlides() {
        return this.hasMore;
    }
    hasPendingOperations() {
        return this.pendingOperations.size > 0;
    }
    subscribeToSlides(callback) {
        return this.on('slidesChanged', callback);
    }
    subscribeToIndex(callback) {
        return this.on('indexChanged', callback);
    }
    subscribeToLoading(callback) {
        return this.on('loading', callback);
    }
    subscribeToHasMore(callback) {
        return this.on('hasMoreChanged', callback);
    }
    subscribeToTemplates(callback) {
        return this.on('templateRegistered', callback);
    }
    subscribeToInitializationError(callback) {
        return this.on('initializationError', callback);
    }
}