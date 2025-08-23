import cssContent from './slider-track.css?raw';
import htmlContent from './slider-track.html?raw';
import { container } from '@/core/DI.js';
class SliderTrackController {
    constructor(element, sliderService) {
        this.element = element;
        this.sliderService = sliderService;
        this.slides = [];
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
        this.slides.forEach((slideData, index) => {
            const slideElement = document.createElement('slider-slide');
            slideElement.setAttribute('data-index', index.toString());
            if (slideData && slideData.id != null) {
                slideElement.setAttribute('slide-id', slideData.id.toString());
            } else {
                console.warn(`Slide at index ${index} has no valid ID`, slideData);
            }
            track.appendChild(slideElement);
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
    setCurrentIndex(index) {
        this.currentIndex = index;
        this.scrollToSlide(index);
    }
    scrollToSlide(index) {
        const track = this.element.shadowRoot.querySelector('.slider-track');
        const slideWidth = this.getSlideWidth();
        if (!track) return;
        track.style.transition = 'none';
        track.style.transform = `translateX(-${index * slideWidth}px)`;
        requestAnimationFrame(() => {
            track.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            track.style.transform = `translateX(-${index * slideWidth}px)`;
        });
    }
    getSlideWidth() {
        const firstSlide = this.element.shadowRoot.querySelector('slider-slide');
        return firstSlide?.offsetWidth || 400;
    }
    destroy() {
        if (this.unsubscribeSlides) this.unsubscribeSlides();
        if (this.unsubscribeIndex) this.unsubscribeIndex();
        if (this.unsubscribeLoading) this.unsubscribeLoading();
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
        const templateService = container.resolve('TemplateService');
        await templateService.loadOnce('slider-track', htmlContent);
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