import { Cache } from '../utils/cache.js';
import { apiService } from './api.js';
import { EventEmitter } from '../core/EventEmitter.js';

export class SliderService extends EventEmitter {
    constructor() {
        super();
        this.cache = new Cache(50);
        this.slides = [];
        this.currentIndex = 0;
    }

    async loadSlides(offset = 0, limit = 10) {
        const cacheKey = `slides_${offset}_${limit}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const slides = await apiService.fetchSlides(offset, limit);
            this.cache.set(cacheKey, slides);
            return slides;
        } catch (error) {
            console.error('Error loading slides:', error);
            throw error;
        }
    }

    async getSlideById(id) {
        const cacheKey = `slide_${id}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const slide = await apiService.fetchSlideById(id);
            this.cache.set(cacheKey, slide);
            return slide;
        } catch (error) {
            console.error('Error loading slide:', error);
            throw error;
        }
    }

    async loadMoreSlides(currentSlides, limit = 5) {
        const offset = currentSlides.length;
        const newSlides = await this.loadSlides(offset, limit);
        return [...currentSlides, ...newSlides];
    }

    // Управление состоянием слайдера
    getCurrentIndex() {
        return this.currentIndex;
    }

    setCurrentIndex(index) {
        if (index < 0 || index >= this.slides.length) {
            return false;
        }

        this.currentIndex = index;
        this.emit('indexChanged', index);
        return true;
    }

    getSlides() {
        return this.slides;
    }

    setSlides(slides) {
        this.slides = slides;
        this.emit('slidesChanged', slides);
    }

    // Навигация
    canGoPrev() {
        return this.currentIndex > 0;
    }

    canGoNext() {
        return true; // Всегда можно загружать новые слайды
    }

    async goToSlide(index, slides) {
        if (index < 0 || index >= slides.length) {
            return false;
        }

        this.currentIndex = index;
        this.emit('indexChanged', index);
        return true;
    }

    async nextSlide(slides) {
        const nextIndex = this.currentIndex + 1;

        if (nextIndex >= slides.length) {
            // Нужно загрузить больше слайдов
            const newSlides = await this.loadMoreSlides(slides);
            this.slides = newSlides;
            this.emit('slidesChanged', newSlides);
            this.currentIndex = nextIndex;
            this.emit('indexChanged', nextIndex);
            return { slides: newSlides, index: nextIndex };
        } else {
            this.currentIndex = nextIndex;
            this.emit('indexChanged', nextIndex);
            return { slides: null, index: nextIndex };
        }
    }

    prevSlide() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.emit('indexChanged', this.currentIndex);
            return true;
        }
        return false;
    }

    // Методы для подписки на конкретные данные
    subscribeToSlides(callback) {
        return this.on('slidesChanged', callback);
    }

    subscribeToIndex(callback) {
        return this.on('indexChanged', callback);
    }

    subscribeToSlideData(slideIndex, callback) {
        // Для подписки на данные конкретного слайда
        const handler = (slides) => {
            if (slides[slideIndex]) {
                callback(slides[slideIndex]);
            }
        };

        return this.on('slidesChanged', handler);
    }
}