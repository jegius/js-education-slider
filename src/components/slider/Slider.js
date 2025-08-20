class CustomSlider extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.sliderService = null;
        this.unsubscribeError = null;
    }

    async connectedCallback() {
        await this.render();
        await this.initService();
    }

    async render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                }
                .slider-container {
                    position: relative;
                    width: 100%;
                    max-width: 800px;
                    margin: 0 auto;
                    overflow: hidden;
                    border-radius: 12px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                    background: white;
                }
                .error-message {
                    padding: 40px;
                    text-align: center;
                    color: #ff6b6b;
                    font-size: 18px;
                }
                .loading-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 400px;
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                .retry-container {
                    text-align: center;
                    padding: 20px;
                }
                .retry-btn {
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                }
                .retry-btn:hover {
                    background: #5a6fd8;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
            <div class="slider-container">
                <div class="loading-container">
                    <div class="spinner"></div>
                </div>
            </div>
        `;
    }

    async initService() {
        try {
            this.sliderService = window.container.resolve('SliderService');

            // Подписываемся на ошибки инициализации
            this.unsubscribeError = this.sliderService.subscribeToInitializationError((error) => {
                this.showInitializationError(error);
            });

            // Ждем инициализации сервиса
            if (!this.sliderService.initialized) {
                await this.sliderService.initialize();
            }

            this.renderSlider();
        } catch (error) {
            console.error('Failed to initialize slider service:', error);
            this.showServiceError();
        }
    }

    renderSlider() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                }
                .slider-container {
                    position: relative;
                    width: 100%;
                    max-width: 800px;
                    margin: 0 auto;
                    overflow: hidden;
                    border-radius: 12px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                    background: white;
                }
            </style>
            <div class="slider-container">
                <slider-track></slider-track>
                <slider-controls></slider-controls>
                <slider-dots></slider-dots>
            </div>
        `;
    }

    showServiceError() {
        this.shadowRoot.innerHTML = `
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
            <div style="padding: 20px; text-align: center; color: red; background: #ffe6e6; border-radius: 8px;">
                <h3>Ошибка загрузки слайдера</h3>
                <p>${error.message || 'Не удалось загрузить данные слайдера'}</p>
                <div class="retry-container">
                    <button class="retry-btn" onclick="location.reload()">Повторить</button>
                </div>
            </div>
        `;
    }

    disconnectedCallback() {
        if (this.unsubscribeError) {
            this.unsubscribeError();
        }
    }
}

customElements.define('custom-slider', CustomSlider);