import cssContent from './slider-dots.css?raw';
import htmlContent from './slider-dots.html?raw';
import { container } from '@/core/DI.js';

class SliderDotsController {
    constructor(element, sliderService) {
        this.element = element;
        this.sliderService = sliderService;
        this.slides = [];
        this.currentIndex = 0;
        this.unsubscribeSlides = null;
        this.unsubscribeIndex = null;
        this.isNavigating = false;
    }

    async init() {
        if (!this.sliderService) {
            console.error('SliderService not available in SliderDotsController');
            return;
        }

        this.render();
        this.subscribeToService();
        this.initFromService();
    }

    render() {
        const template = document.getElementById('slider-dots-template');
        if (template) {
            this.element.shadowRoot.innerHTML = '';
            // Вставляем стили
            const styleElement = document.createElement('style');
            styleElement.textContent = cssContent;
            this.element.shadowRoot.appendChild(styleElement);

            const clone = document.importNode(template.content, true);
            this.element.shadowRoot.appendChild(clone);
        } else {
            console.error('SliderDots template not found');
            this.element.shadowRoot.innerHTML = `<style>${cssContent}</style><div>Ошибка загрузки шаблона slider-dots</div>`;
        }
    }

    initFromService() {
        const slides = this.sliderService.getSlides();
        const index = this.sliderService.getCurrentIndex();
        if (slides.length > 0) {
            this.setSlides(slides);
        }
        this.setCurrentIndex(index);
    }

    subscribeToService() {
        this.unsubscribeSlides = this.sliderService.subscribeToSlides((slides) => {
            this.setSlides(slides);
        });
        this.unsubscribeIndex = this.sliderService.subscribeToIndex((index) => {
            this.setCurrentIndex(index);
        });
    }

    setSlides(slides) {
        this.slides = slides || [];
        this.renderDots();
    }

    renderDots() {
        const dotsContainer = this.element.shadowRoot.querySelector('.slider-dots');
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        this.slides.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = 'dot';
            dot.setAttribute('data-index', index);
            dot.setAttribute('aria-label', `Перейти к слайду ${index + 1}`);
            if (index === this.currentIndex) {
                dot.classList.add('active');
            }
            if (this.isNavigating) {
                dot.classList.add('navigating');
                dot.disabled = true;
            }
            dot.addEventListener('click', (e) => {
                e.preventDefault();
                this.goToSlide(index);
            });
            dotsContainer.appendChild(dot);
        });
    }

    setCurrentIndex(index) {
        this.currentIndex = index;
        this.updateActiveDot();
    }

    updateActiveDot() {
        const dots = this.element.shadowRoot.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
            dot.classList.remove('navigating');
            dot.disabled = false;
        });
    }

    async goToSlide(index) {
        if (!this.sliderService || this.isNavigating || index === this.currentIndex) return;
        this.isNavigating = true;
        this.updateDotsNavigationState();
        try {
            await this.sliderService.goToSlide(index);
        } catch (error) {
            console.error('Error navigating to slide:', error);
        } finally {
            this.isNavigating = false;
            this.updateDotsNavigationState();
        }
    }

    updateDotsNavigationState() {
        const dots = this.element.shadowRoot.querySelectorAll('.dot');
        dots.forEach(dot => {
            if (this.isNavigating) {
                dot.classList.add('navigating');
                dot.disabled = true;
            } else {
                dot.classList.remove('navigating');
                dot.disabled = false;
            }
        });
    }

    destroy() {
        const unsubscribes = [this.unsubscribeSlides, this.unsubscribeIndex];
        unsubscribes.forEach(unsubscribe => {
            if (unsubscribe) unsubscribe();
        });
    }
}

class SliderDots extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.controller = null;
        this.sliderService = null;
        try {
            this.sliderService = container.resolve('SliderService');
        } catch (error) {
            console.error('Failed to resolve SliderService in SliderDots component:', error);
        }
    }

    async connectedCallback() {
        const templateService = container.resolve('TemplateService');
        await templateService.loadOnce('slider-dots', htmlContent);
        this.controller = new SliderDotsController(this, this.sliderService);
        this.controller.init();
    }

    disconnectedCallback() {
        if (this.controller) {
            this.controller.destroy();
        }
    }
}

customElements.define('slider-dots', SliderDots);