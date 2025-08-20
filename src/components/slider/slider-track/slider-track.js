import cssContent from './slider-track.css?raw';
import htmlContent from './slider-track.html?raw';
import { container } from '@/core/DI.js';

const loadTemplate = async () => {
    if (document.getElementById('slider-track-template')) return;

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const templates = doc.querySelectorAll('template');
        templates.forEach(template => {
            if (template.id && !document.getElementById(template.id)) {
                document.head.appendChild(template);
            }
        });
    } catch (error) {
        console.error('Error parsing slider-track.html:', error);
    }
};

class SliderTrackController {
    constructor(element, sliderService) {
        this.element = element;
        this.sliderService = sliderService;
        this.slides = [];
        this.currentIndex = 0;
        this.isAnimating = false;
        this.unsubscribeSlides = null;
        this.unsubscribeIndex = null;
        this.unsubscribeLoading = null;
        this.isLoading = false;
    }

    async init() {
        if (!this.sliderService) {
            console.error('SliderService not available in SliderTrackController');
            return;
        }

        this.render();
        this.subscribeToService();
        this.initSlides();
    }

    render() {
        const template = document.getElementById('slider-track-template');
        if (template) {
            this.element.shadowRoot.innerHTML = '';
            // Вставляем стили
            const styleElement = document.createElement('style');
            styleElement.textContent = cssContent;
            this.element.shadowRoot.appendChild(styleElement);

            const clone = document.importNode(template.content, true);
            this.element.shadowRoot.appendChild(clone);
        } else {
            console.error('SliderTrack template not found');
            this.element.shadowRoot.innerHTML = `<style>${cssContent}</style><div>Ошибка загрузки шаблона slider-track</div>`;
        }
    }

    initSlides() {
        const slides = this.sliderService.getSlides();
        if (slides.length > 0) {
            this.setSlides(slides);
        }
    }

    subscribeToService() {
        this.unsubscribeSlides = this.sliderService.subscribeToSlides((slides) => {
            this.setSlides(slides);
        });
        this.unsubscribeIndex = this.sliderService.subscribeToIndex((index) => {
            this.setCurrentIndex(index);
        });
        this.unsubscribeLoading = this.sliderService.subscribeToLoading((loading) => {
            this.isLoading = loading;
            this.handleLoadingState();
        });
    }

    handleLoadingState() {
        const track = this.element.shadowRoot.querySelector('.slider-track');
        if (track) {
            track.style.opacity = this.isLoading ? '0.7' : '1';
        }
    }

    setSlides(slides) {
        this.slides = slides || [];
        this.renderSlides();
    }

    renderSlides() {
        const track = this.element.shadowRoot.querySelector('.slider-track');
        if (!track) return;
        track.innerHTML = '';
        this.slides.forEach((_, index) => {
            const slideElement = document.createElement('slider-slide');
            slideElement.setAttribute('data-index', index.toString());
            track.appendChild(slideElement);
            this.subscribeSlideToData(slideElement, index);
        });
        if (this.isLoading) {
            this.addLoadingIndicator(track);
        }
    }

    addLoadingIndicator(track) {
        const loadingElement = document.createElement('div');
        loadingElement.className = 'loading-indicator';
        loadingElement.innerHTML = `<div class="spinner"></div>`;
        track.appendChild(loadingElement);
    }

    subscribeSlideToData(slideElement, index) {
        const unsubscribe = this.sliderService.on('slidesChanged', (slides) => {
            if (slides[index]) {
                slideElement.slideData = slides[index];
            }
        });
        slideElement.unsubscribe = unsubscribe;
        const currentSlides = this.sliderService.getSlides();
        if (currentSlides[index]) {
            slideElement.slideData = currentSlides[index];
        }
    }

    setCurrentIndex(index) {
        this.currentIndex = index;
        this.scrollToSlide(index);
    }

    scrollToSlide(index) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        const track = this.element.shadowRoot.querySelector('.slider-track');
        const slideWidth = this.getSlideWidth();
        if (track) {
            track.style.transform = `translateX(-${index * slideWidth}px)`;
            track.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }
        setTimeout(() => {
            this.isAnimating = false;
            if (track) {
                track.style.transition = '';
            }
        }, 400);
    }

    getSlideWidth() {
        const firstSlide = this.element.shadowRoot.querySelector('slider-slide');
        return firstSlide?.offsetWidth || 400;
    }

    destroy() {
        if (this.unsubscribeSlides) this.unsubscribeSlides();
        if (this.unsubscribeIndex) this.unsubscribeIndex();
        if (this.unsubscribeLoading) this.unsubscribeLoading();

        const slideElements = this.element.shadowRoot.querySelectorAll('slider-slide');
        slideElements.forEach(slide => {
            if (slide.unsubscribe) {
                slide.unsubscribe();
            }
        });
    }
}

class SliderTrack extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.controller = null;
        this.sliderService = null;
        try {
            this.sliderService = container.resolve('SliderService');
        } catch (error) {
            console.error('Failed to resolve SliderService in SliderTrack:', error);
        }
    }

    async connectedCallback() {
        await loadTemplate();
        this.controller = new SliderTrackController(this, this.sliderService);
        this.controller.init();
    }

    disconnectedCallback() {
        if (this.controller) {
            this.controller.destroy();
        }
    }
}

customElements.define('slider-track', SliderTrack);