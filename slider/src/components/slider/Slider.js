class CustomSlider extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        try {
            this.sliderService = window.container.resolve('SliderService');
        } catch (error) {
            console.error('Failed to resolve SliderService:', error);
            this.sliderService = null;
        }
    }

    async connectedCallback() {
        await this.render();
        if (this.sliderService) {
            await this.initSlider();
        } else {
            this.showServiceError();
        }
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
            </style>
            <div class="slider-container">
                <slider-track></slider-track>
                <slider-controls></slider-controls>
                <slider-dots></slider-dots>
            </div>
        `;
    }

    async initSlider() {
        try {
            const slides = await this.sliderService.loadSlides(0, 5);
            this.sliderService.setSlides(slides);
            this.sliderService.setCurrentIndex(0);
        } catch (error) {
            console.error('Error initializing slider:', error);
            this.showError();
        }
    }

    showServiceError() {
        this.shadowRoot.innerHTML = `
            <div style="padding: 20px; text-align: center; color: red; background: #ffe6e6; border-radius: 8px;">
                <h3>Ошибка инициализации сервиса</h3>
                <p>SliderService не найден в DI контейнере</p>
            </div>
        `;
    }

    showError() {
        const container = this.shadowRoot.querySelector('.slider-container');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <p>Ошибка загрузки слайдера</p>
                </div>
            `;
        }
    }
}

customElements.define('custom-slider', CustomSlider);