export class TemplateService {
    constructor() {
        this.templates = new Map();
        this.loadedFiles = new Set();
        this.defaultTemplate = this.createDefaultTemplate();
    }
    async loadFromString(htmlContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const templates = doc.querySelectorAll('template');
        templates.forEach(template => {
            if (template.id && !document.getElementById(template.id)) {
                document.head.appendChild(template);
            }
        });
    }
    async loadOnce(id, htmlContent) {
        if (this.loadedFiles.has(id)) return;
        await this.loadFromString(htmlContent);
        this.loadedFiles.add(id);
    }
    createDefaultTemplate() {
        return (slideData) => `
            <div class="slide-content">
                <img src="${slideData.image || '/placeholder.jpg'}" 
                     alt="${slideData.title || 'Слайд'}"
                     class="slide-image"
                     onerror="this.src='/placeholder.jpg'">
                <div class="slide-info">
                    <h3 class="slide-title">${slideData.title || 'Без названия'}</h3>
                    <p class="slide-description">${slideData.description || 'Описание отсутствует'}</p>
                    <div class="slide-meta">
                        <span class="slide-id">ID: ${slideData.id}</span>
                    </div>
                </div>
            </div>
        `;
    }
    registerTemplate(name, templateFunction) {
        this.templates.set(name, templateFunction);
    }
    getTemplate(name) {
        return this.templates.get(name) || this.defaultTemplate;
    }
}