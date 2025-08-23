import cssContent from './slider-slide.css?raw';
import htmlContent from './slider-slide.html?raw';
import { container } from '@/core/DI.js';

class SliderSlideController {
    constructor(element, sliderService) {
        this.element = element;
        this.sliderService = sliderService;
        this.slideId = null;
        this.subscription = null;
        this.templateName = 'default';
    }

    async init(slideId = null, templateName = 'default') {
        if (slideId != null) {
            this.slideId = slideId;
        }
        if (templateName) {
            this.templateName = templateName;
        }
        if (this.slideId != null && this.sliderService) {
            this.observeSlideData();
        } else {
            this.render(null);
        }
    }

    observeSlideData() {
        if (this.subscription) {
            this.subscription();
            this.subscription = null;
        }
        if (this.slideId != null && this.sliderService) {
            const observeFn = this.sliderService.observeSlideData(this.slideId);
            this.subscription = observeFn((newSlideData) => {
                console.log(`SliderSlideController: Received new data for slide ${this.slideId}`, newSlideData);
                this.render(newSlideData);
            });
        }
    }

    setSlideId(id) {
        if (this.slideId === id) return;
        this.slideId = id;
        this.observeSlideData();
        if (this.slideId != null) {
        } else {
            this.render(null);
        }
    }

    setTemplateName(templateName) {
        this.templateName = templateName || 'default';
        const currentData = this.sliderService?.getSlideData(this.slideId) || null;
        this.render(currentData);
    }

    render(slideData) {
        this.currentSlideData = slideData;

        if (!slideData) {
            this.renderPlaceholder();
            return;
        }

        let templateFunction;
        try {
            templateFunction = this.sliderService?.getTemplate(this.templateName);
        } catch (e) {
            console.warn(`Template '${this.templateName}' not found, using default.`, e);
            templateFunction = this.sliderService?.getTemplate('default');
        }

        if (templateFunction && typeof templateFunction === 'function' && this.templateName !== 'default') {
            this.renderCustomTemplate(slideData, templateFunction);
        } else {
            this.renderDefaultTemplate(slideData);
        }
    }

    renderPlaceholder() {
        const template = document.getElementById('slider-slide-placeholder');
        if (template) {
            this.element.shadowRoot.innerHTML = '';
            const styleElement = document.createElement('style');
            styleElement.textContent = cssContent;
            this.element.shadowRoot.appendChild(styleElement);
            const clone = document.importNode(template.content, true);
            this.element.shadowRoot.appendChild(clone);
        } else {
            console.error('SliderSlide placeholder template not found');
            this.element.shadowRoot.innerHTML = `<style>${cssContent}</style><div>Ошибка загрузки шаблона slider-slide-placeholder</div>`;
        }
    }

    renderCustomTemplate(slideData, templateFunction) {
        try {
            const htmlContent = templateFunction(slideData);
            this.element.shadowRoot.innerHTML = '';
            const styleElement = document.createElement('style');
            styleElement.textContent = cssContent;
            this.element.shadowRoot.appendChild(styleElement);
            this.element.shadowRoot.innerHTML += htmlContent;
        } catch (error) {
            console.error('Error rendering custom template:', error);
            this.renderDefaultTemplate(slideData);
        }
    }

    renderDefaultTemplate(slideData) {
        const template = document.getElementById('slider-slide-default');
        if (template) {
            this.element.shadowRoot.innerHTML = '';
            const styleElement = document.createElement('style');
            styleElement.textContent = cssContent;
            this.element.shadowRoot.appendChild(styleElement);
            const clone = document.importNode(template.content, true);
            const img = clone.querySelector('.slide-image');
            const title = clone.querySelector('.slide-title');
            const description = clone.querySelector('.slide-description');
            const idSpan = clone.querySelector('.slide-id');
            if (img) img.src = slideData.image || '/placeholder.jpg';
            if (img) img.alt = slideData.title || 'Слайд';
            if (title) title.textContent = slideData.title || 'Без названия';
            if (description) description.textContent = slideData.description || 'Описание отсутствует';
            if (idSpan) idSpan.textContent = `ID: ${slideData.id}`;
            this.element.shadowRoot.appendChild(clone);
        } else {
            console.error('SliderSlide default template not found');
            this.element.shadowRoot.innerHTML = `<style>${cssContent}</style><div>Ошибка загрузки шаблона slider-slide-default</div>`;
        }
    }

    destroy() {
        if (this.subscription) {
            this.subscription();
            this.subscription = null;
        }
        this.slideId = null;
        this.currentSlideData = null;
        this.templateName = 'default';
    }
}

class SliderSlide extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.controller = null;
        this._slideId = null;
        this.sliderService = null;
        try {
            this.sliderService = container.resolve('SliderService');
        } catch (error) {
            console.error('Failed to resolve SliderService in SliderSlide:', error);
        }
    }

    static get observedAttributes() {
        return ['slide-id', 'template'];
    }

    set slideId(id) {
        const numericId = (typeof id === 'string') ? parseInt(id, 10) : id;
        if (isNaN(numericId) && id !== null && id !== undefined) {
            console.warn('Invalid slide ID provided to slideId setter:', id);
            return;
        }
        this._slideId = numericId;
        this.setAttribute('slide-id', numericId);
        if (this.controller) {
            this.controller.setSlideId(numericId);
        }
    }

    get slideId() {
        return this._slideId;
    }

    set template(templateName) {
        this.setAttribute('template', templateName);
        if (this.controller) {
            this.controller.setTemplateName(templateName);
        }
    }

    get template() {
        return this.getAttribute('template') || 'default';
    }

    async connectedCallback() {
        const templateService = container.resolve('TemplateService');
        await templateService.loadOnce('slider-slide', htmlContent);

        this.controller = new SliderSlideController(this, this.sliderService);

        const initialTemplate = this.getAttribute('template') || 'default';
        this.controller.init(this._slideId, initialTemplate);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'slide-id') {
            if (newValue === null) {
                this._slideId = null;
            } else {
                const parsedId = parseInt(newValue, 10);
                if (!isNaN(parsedId)) {
                    this._slideId = parsedId;
                } else {
                    console.warn('Invalid slide-id attribute value:', newValue);
                    this._slideId = null;
                }
            }
            if (this.controller) {
                this.controller.setSlideId(this._slideId);
            }
        }
        if (name === 'template') {
            if (this.controller) {
                this.controller.setTemplateName(newValue);
            }
        }
    }

    disconnectedCallback() {
        if (this.controller) {
            this.controller.destroy();
        }
    }
}

customElements.define('slider-slide', SliderSlide);
