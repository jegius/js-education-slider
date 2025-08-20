import cssContent from './slider-slide.css?raw';
import htmlContent from './slider-slide.html?raw';
import { container } from '@/core/DI.js';

class SliderSlideController {
    constructor(element, sliderService) {
        this.element = element;
        this.sliderService = sliderService;
        this._slideData = null;
        this.templateFunction = null;
        this.unsubscribeTemplate = null;
    }

    async init() {
        // Если доступен сервис шаблонов, подписываемся на обновления
        if (this.sliderService) {
            this.subscribeToTemplates();
        }
        // Если данных нет, показываем placeholder
        if (!this._slideData) {
            this.renderPlaceholder();
        }
    }

    // Подписка на обновления кастомных шаблонов
    subscribeToTemplates() {
        this.unsubscribeTemplate = this.sliderService.subscribeToTemplates((templateData) => {
            // Проверяем, относится ли обновление к шаблону, используемому этим слайдом
            if (templateData.name === this.element.template) {
                this.templateFunction = templateData.templateFunction;
                // Если данные уже есть, перерисовываем с новым шаблоном
                if (this._slideData) {
                    this.render();
                }
            }
        });
    }

    // Сеттер для данных слайда
    set slideData(data) {
        this._slideData = data;
        this.render();
    }

    // Геттер для данных слайда
    get slideData() {
        return this._slideData;
    }

    // Основной метод рендеринга
    render() {
        if (!this._slideData) {
            this.renderPlaceholder();
            return;
        }
        // Если есть кастомный шаблон, используем его
        if (this.templateFunction) {
            this.renderCustomTemplate();
        } else {
            // Иначе используем стандартный шаблон
            this.renderDefaultTemplate();
        }
    }

    // Рендеринг placeholder'а
    renderPlaceholder() {
        const template = document.getElementById('slider-slide-placeholder');
        if (template) {
            this.element.shadowRoot.innerHTML = '';
            // Вставляем CSS
            const styleElement = document.createElement('style');
            styleElement.textContent = cssContent;
            this.element.shadowRoot.appendChild(styleElement);

            const clone = document.importNode(template.content, true);
            // Обновляем изображение в placeholder'е, если есть данные
            const img = clone.querySelector('.slide-image');
            if (img && this._slideData) {
                img.src = this._slideData.image || '/placeholder.jpg';
                img.alt = this._slideData.title || 'Слайд';
            }
            this.element.shadowRoot.appendChild(clone);
        } else {
            console.error('SliderSlide placeholder template not found');
            // Резервный вариант с базовыми стилями
            this.element.shadowRoot.innerHTML = `<style>${cssContent}</style><div>Ошибка загрузки шаблона slider-slide-placeholder</div>`;
        }
    }

    // Рендеринг с кастомным шаблоном
    renderCustomTemplate() {
        try {
            // Генерируем HTML с помощью функции шаблона
            const htmlContent = this.templateFunction(this._slideData);

            this.element.shadowRoot.innerHTML = '';

            // Вставляем CSS
            const styleElement = document.createElement('style');
            styleElement.textContent = cssContent;
            this.element.shadowRoot.appendChild(styleElement);

            // Вставляем сгенерированный HTML
            this.element.shadowRoot.innerHTML += htmlContent;

        } catch (error) {
            console.error('Error rendering custom template:', error);
            // В случае ошибки используем стандартный шаблон
            this.renderDefaultTemplate();
        }
    }

    // Рендеринг со стандартным шаблоном
    renderDefaultTemplate() {
        const template = document.getElementById('slider-slide-default');
        if (template) {
            this.element.shadowRoot.innerHTML = '';
            // Вставляем CSS
            const styleElement = document.createElement('style');
            styleElement.textContent = cssContent;
            this.element.shadowRoot.appendChild(styleElement);

            // Клонируем шаблон
            const clone = document.importNode(template.content, true);
            // Заполняем данными
            const img = clone.querySelector('.slide-image');
            const title = clone.querySelector('.slide-title');
            const description = clone.querySelector('.slide-description');
            const idSpan = clone.querySelector('.slide-id');

            if (img) img.src = this._slideData.image || '/placeholder.jpg';
            if (img) img.alt = this._slideData.title || 'Слайд';
            if (title) title.textContent = this._slideData.title || 'Без названия';
            if (description) description.textContent = this._slideData.description || 'Описание отсутствует';
            if (idSpan) idSpan.textContent = `ID: ${this._slideData.id}`;

            this.element.shadowRoot.appendChild(clone);
        } else {
            console.error('SliderSlide default template not found');
            // Резервный вариант с базовыми стилями
            this.element.shadowRoot.innerHTML = `<style>${cssContent}</style><div>Ошибка загрузки шаблона slider-slide-default</div>`;
        }
    }

    // Очистка подписок
    destroy() {
        if (this.unsubscribeTemplate) {
            this.unsubscribeTemplate();
        }
    }
}

// Основной Web Component
class SliderSlide extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.controller = null;
        this._slideData = null;
        this.unsubscribeTemplate = null;
        this.sliderService = null;
        // Пытаемся получить сервис через DI
        try {
            this.sliderService = container.resolve('SliderService');
        } catch (error) {
            console.error('Failed to resolve SliderService in SliderSlide:', error);
        }
    }

    // Наблюдаемые атрибуты
    static get observedAttributes() {
        return ['slide-data', 'template'];
    }

    // Сеттер для данных слайда
    set slideData(data) {
        this._slideData = data;
        if (this.controller) {
            this.controller.slideData = data;
        }
    }

    // Геттер для данных слайда
    get slideData() {
        return this._slideData;
    }

    // Сеттер для имени шаблона
    set template(templateName) {
        this.setAttribute('template', templateName);
    }

    // Геттер для имени шаблона
    get template() {
        return this.getAttribute('template') || 'default';
    }

    async connectedCallback() {
        const templateService = container.resolve('TemplateService');
        await templateService.loadOnce('slider-slide', htmlContent);
        this.controller = new SliderSlideController(this, this.sliderService);
        this.controller.init();
        if (this._slideData) {
            this.controller.slideData = this._slideData;
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
    }

    disconnectedCallback() {
        if (this.controller) {
            this.controller.destroy();
        }
    }
}

// Регистрируем кастомный элемент
customElements.define('slider-slide', SliderSlide);