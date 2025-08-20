import cssContent from './slider-controls.css?raw';
import htmlContent from './slider-controls.html?raw';
import { container } from '@/core/DI.js';


class SliderControlsController {
    constructor(element, sliderService) {
        this.element = element;
        this.sliderService = sliderService;
        this.unsubscribeIndex = null;
        this.unsubscribeHasMore = null;
        this.unsubscribeLoading = null;
        this.unsubscribeSlides = null;
        this.hasMore = true;
        this.isLoading = false;
        this.slides = [];
    }

    async init() {
        if (!this.sliderService) {
            console.error('SliderService not available in SliderControlsController');
            return;
        }

        this.render();
        this.setupEventListeners();
        this.subscribeToService();
        this.updateNavigation();
    }

    render() {
        const template = document.getElementById('slider-controls-template');
        if (template) {
            this.element.shadowRoot.innerHTML = '';
            // Вставляем стили
            const styleElement = document.createElement('style');
            styleElement.textContent = cssContent;
            this.element.shadowRoot.appendChild(styleElement);

            const clone = document.importNode(template.content, true);
            this.element.shadowRoot.appendChild(clone);
        } else {
            console.error('SliderControls template not found');
            this.element.shadowRoot.innerHTML = `<style>${cssContent}</style><div>Ошибка загрузки шаблона slider-controls</div>`;
        }
    }

    subscribeToService() {
        this.unsubscribeIndex = this.sliderService.subscribeToIndex(() => {
            this.updateNavigation();
        });
        this.unsubscribeHasMore = this.sliderService.subscribeToHasMore((hasMore) => {
            this.hasMore = hasMore;
            this.updateNavigation();
        });
        this.unsubscribeLoading = this.sliderService.subscribeToLoading((loading) => {
            this.isLoading = loading;
            this.updateNavigation();
        });
        this.unsubscribeSlides = this.sliderService.subscribeToSlides((slides) => {
            this.slides = slides;
            this.updateNavigation();
        });
    }

    setupEventListeners() {
        const prevBtn = this.element.shadowRoot.querySelector('.slider-prev');
        const nextBtn = this.element.shadowRoot.querySelector('.slider-next');

        prevBtn?.addEventListener('click', () => this.handlePrevClick());
        nextBtn?.addEventListener('click', () => this.handleNextClick());

        this.element.handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') this.handlePrevClick();
            if (e.key === 'ArrowRight') this.handleNextClick();
        };
        document.addEventListener('keydown', this.element.handleKeyDown);
    }

    async handleNextClick() {
        if (!this.sliderService || this.isLoading) return;
        try {
            await this.sliderService.nextSlide();
        } catch (error) {
            console.error('Error in next slide:', error);
        }
    }

    async handlePrevClick() {
        if (!this.sliderService || this.isLoading) return;
        try {
            await this.sliderService.prevSlide();
        } catch (error) {
            console.error('Error in prev slide:', error);
        }
    }

    updateNavigation() {
        if (!this.sliderService) return;
        const prevBtn = this.element.shadowRoot.querySelector('.slider-prev');
        const nextBtn = this.element.shadowRoot.querySelector('.slider-next');
        const btnText = nextBtn?.querySelector('.btn-text');

        const currentIndex = this.sliderService.getCurrentIndex();
        const slides = this.sliderService.getSlides();
        const hasMore = this.sliderService.hasMoreSlides();

        if (prevBtn) {
            const canGoPrev = currentIndex > 0;
            prevBtn.disabled = !canGoPrev || this.isLoading;
        }

        if (nextBtn) {
            const canGoNext = currentIndex < slides.length - 1 || (hasMore && slides.length > 0);
            nextBtn.disabled = !canGoNext || this.isLoading;

            if (btnText) {
                if (this.isLoading) {
                    btnText.innerHTML = '<div class="spinner"></div>';
                } else {
                    btnText.textContent = '›';
                }
            }
        }
    }

    destroy() {
        const unsubscribes = [
            this.unsubscribeIndex,
            this.unsubscribeHasMore,
            this.unsubscribeLoading,
            this.unsubscribeSlides
        ];
        unsubscribes.forEach(unsubscribe => {
            if (unsubscribe) unsubscribe();
        });

        if (this.element.handleKeyDown) {
            document.removeEventListener('keydown', this.element.handleKeyDown);
            delete this.element.handleKeyDown;
        }
    }
}

class SliderControls extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.controller = null;
        this.sliderService = null;
        try {
            this.sliderService = container.resolve('SliderService');
        } catch (error) {
            console.error('Failed to resolve SliderService in SliderControls component:', error);
        }
    }

    async connectedCallback() {
        const templateService = container.resolve('TemplateService');
        await templateService.loadOnce('slider-controls', htmlContent);
        this.controller = new SliderControlsController(this, this.sliderService);
        this.controller.init();
    }

    disconnectedCallback() {
        if (this.controller) {
            this.controller.destroy();
        }
    }
}

customElements.define('slider-controls', SliderControls);