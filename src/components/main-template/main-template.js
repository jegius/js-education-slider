import cssContent from './main-template.css?raw';
import htmlContent from './main-template.html?raw';
import { container } from '@/core/DI.js';

class MainTemplate extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    async connectedCallback() {
        const templateService = container.resolve('TemplateService');
        await templateService.loadOnce('main-template', htmlContent);
        this.render();
    }

    render() {
        const template = document.getElementById('main-template-content');
        if (template) {
            this.shadowRoot.innerHTML = '';
            // Вставляем стили
            const styleElement = document.createElement('style');
            styleElement.textContent = cssContent;
            this.shadowRoot.appendChild(styleElement);

            const clone = document.importNode(template.content, true);
            this.shadowRoot.appendChild(clone);
        } else {
            console.error('Main template not found');
            // Даже при ошибке добавляем стили
            this.shadowRoot.innerHTML = `<style>${cssContent}</style><div>Ошибка загрузки шаблона</div>`;
        }
    }
}

customElements.define('main-template', MainTemplate);