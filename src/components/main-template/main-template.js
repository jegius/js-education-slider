import cssContent from './main-template.css?raw';
import htmlContent from './main-template.html?raw';

const loadTemplate = async () => {
    if (document.getElementById('main-template-content')) return;

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
        console.error('Error parsing main-template.html:', error);
    }
};

class MainTemplate extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    async connectedCallback() {
        await loadTemplate();
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