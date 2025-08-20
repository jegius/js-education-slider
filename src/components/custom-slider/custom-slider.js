import cssContent from './custom-slider.css?raw';
import htmlContent from './custom-slider.html?raw';
import { container } from '@/core/DI.js';


class CustomSlider extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.sliderService = null;
        this.unsubscribeError = null;
    }

    async connectedCallback() {
        const templateService = container.resolve('TemplateService');
        await templateService.loadOnce('custom-slider', htmlContent);
        this.renderLoading();
        await this.initService();
    }

    render(templateId) {
        const template = document.getElementById(templateId);
        if (template) {
            this.shadowRoot.innerHTML = '';
            // Вставляем стили
            const styleElement = document.createElement('style');
            styleElement.textContent = cssContent;
            this.shadowRoot.appendChild(styleElement);

            const clone = document.importNode(template.content, true);
            this.shadowRoot.appendChild(clone);
        } else {
            console.error(`Template ${templateId} not found`);
            this.shadowRoot.innerHTML = `<style>${cssContent}</style><div>Ошибка: шаблон ${templateId} не найден</div>`;
        }
    }

    renderLoading() {
        this.render('custom-slider-loading');
    }

    renderSlider() {
        this.render('custom-slider-main');
    }

    showServiceError() {
        // Для ошибок создаем содержимое динамически с включенными стилями
        this.shadowRoot.innerHTML = `
            <style>${cssContent}</style>
            <div style="padding: 20px; text-align: center; color: red; background: #ffe6e6; border-radius: 8px;">
                <h3>Ошибка инициализации сервиса</h3>
                <p>SliderService не найден в DI контейнере</p>
                <div class="retry-container">
                    <button class="retry-btn" onclick="location.reload()">Повторить</button>
                </div>
            </div>
        `;
    }

    showInitializationError(error) {
        this.shadowRoot.innerHTML = `
            <style>${cssContent}</style>
            <div style="padding: 20px; text-align: center; color: red; background: #ffe6e6; border-radius: 8px;">
                <h3>Ошибка загрузки слайдера</h3>
                <p id="error-message">${error.message || 'Не удалось загрузить данные слайдера'}</p>
                <div class="retry-container">
                    <button class="retry-btn" onclick="location.reload()">Повторить</button>
                </div>
            </div>
        `;
    }

    async initService() {
        try {
            this.sliderService = container.resolve('SliderService');
            this.unsubscribeError = this.sliderService.subscribeToInitializationError((error) => {
                this.showInitializationError(error);
            });
            if (!this.sliderService.initialized) {
                await this.sliderService.initialize();
            }
            this.renderSlider();
        } catch (error) {
            console.error('Failed to initialize slider service:', error);
            this.showServiceError();
        }
    }

    disconnectedCallback() {
        if (this.unsubscribeError) {
            this.unsubscribeError();
        }
    }
}

customElements.define('custom-slider', CustomSlider);