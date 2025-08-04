class SliderSlide extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._slideData = null;
    }

    static get observedAttributes() {
        return ['slide-data'];
    }

    set slideData(data) {
        this._slideData = data;
        this.render();
    }

    get slideData() {
        return this._slideData;
    }

    connectedCallback() {
        if (!this._slideData) {
            this.renderPlaceholder();
        }
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
            </style>
            <div class="slide-placeholder">
                <p>Загрузка слайда...</p>
            </div>
        `;
    }

    render() {
        if (!this._slideData) {
            this.renderPlaceholder();
            return;
        }

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
}

customElements.define('slider-slide', SliderSlide);