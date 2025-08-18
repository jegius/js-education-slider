class SliderSlide extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._slideData = null;
        this.templateFunction = null;
        this.unsubscribeTemplate = null;

        try {
            this.sliderService = window.container.resolve('SliderService');
        } catch (error) {
            console.error('Failed to resolve SliderService in SliderSlide:', error);
            this.sliderService = null;
        }
    }

    static get observedAttributes() {
        return ['slide-data', 'template'];
    }

    set slideData(data) {
        this._slideData = data;
        this.render();
    }

    get slideData() {
        return this._slideData;
    }

    set template(templateName) {
        this.setAttribute('template', templateName);
    }

    get template() {
        return this.getAttribute('template') || 'default';
    }

    connectedCallback() {
        if (this.sliderService) {
            this.subscribeToTemplates();
        }
        if (!this._slideData) {
            this.renderPlaceholder();
        }
    }

    subscribeToTemplates() {
        this.unsubscribeTemplate = this.sliderService.subscribeToTemplates((templateData) => {
            if (templateData.templateName === this.template) {
                this.templateFunction = templateData.templateFunction;
                if (this._slideData) {
                    this.render();
                }
            }
        });
    }

    renderPlaceholder() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    min-width: 100%;
                    flex-shrink: 0;
                }
                .slide-placeholder {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 400px;
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    border-radius: 12px;
                    margin: 10px;
                    color: #888;
                    font-style: italic;
                }
                .loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
            <div class="slide-placeholder">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Загрузка слайда...</p>
                </div>
            </div>
        `;
    }

    render() {
        if (!this._slideData) {
            this.renderPlaceholder();
            return;
        }

        // Используем кастомный темплейт если доступен
        if (this.templateFunction) {
            this.renderCustomTemplate();
        } else {
            this.renderDefaultTemplate();
        }
    }

    renderCustomTemplate() {
        try {
            const htmlContent = this.templateFunction(this._slideData);
            this.shadowRoot.innerHTML = `
                <style>
                    :host {
                        min-width: 100%;
                        flex-shrink: 0;
                    }
                    ${this.getCustomStyles()}
                </style>
                ${htmlContent}
            `;
        } catch (error) {
            console.error('Error rendering custom template:', error);
            this.renderDefaultTemplate();
        }
    }

    renderDefaultTemplate() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    min-width: 100%;
                    flex-shrink: 0;
                }
                .slider-slide {
                    min-width: 100%;
                    flex-shrink: 0;
                }
                .slide-content {
                    display: flex;
                    flex-direction: column;
                    height: 400px;
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    border-radius: 12px;
                    overflow: hidden;
                    margin: 10px;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
                }
                .slide-image {
                    width: 100%;
                    height: 250px;
                    object-fit: cover;
                    background: linear-gradient(45deg, #667eea, #764ba2);
                }
                .slide-info {
                    padding: 20px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                .slide-title {
                    margin: 0 0 10px 0;
                    font-size: 1.5rem;
                    color: #333;
                    font-weight: 600;
                }
                .slide-description {
                    margin: 0 0 15px 0;
                    color: #666;
                    line-height: 1.5;
                    flex: 1;
                }
                .slide-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.9rem;
                    color: #888;
                }
                .slide-id {
                    background: #667eea;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-weight: 500;
                }
            </style>
            <div class="slider-slide">
                <div class="slide-content">
                    <img src="${this._slideData.image || '/placeholder.jpg'}" 
                         alt="${this._slideData.title || 'Слайд'}"
                         class="slide-image"
                         onerror="this.src='/placeholder.jpg'">
                    <div class="slide-info">
                        <h3 class="slide-title">${this._slideData.title || 'Без названия'}</h3>
                        <p class="slide-description">${this._slideData.description || 'Описание отсутствует'}</p>
                        <div class="slide-meta">
                            <span class="slide-id">ID: ${this._slideData.id}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getCustomStyles() {
        return `
            .slider-slide {
                min-width: 100%;
                flex-shrink: 0;
            }
            .slide-content {
                height: 400px;
                border-radius: 12px;
                margin: 10px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
            }
        `;
    }

    disconnectedCallback() {
        if (this.unsubscribeTemplate) {
            this.unsubscribeTemplate();
        }
    }
}

customElements.define('slider-slide', SliderSlide);