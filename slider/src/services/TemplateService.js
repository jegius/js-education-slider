export class TemplateService {
    constructor() {
        this.templates = new Map();
        this.defaultTemplate = this.createDefaultTemplate();
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

    hasTemplate(name) {
        return this.templates.has(name);
    }

    getAllTemplates() {
        return new Map(this.templates);
    }
}