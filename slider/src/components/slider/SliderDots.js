class SliderDots extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.slides = [];
        this.currentIndex = 0;
        this.unsubscribeSlides = null;
        this.unsubscribeIndex = null;

        try {
            this.sliderService = window.container.resolve('SliderService');
        } catch (error) {
            console.error('Failed to resolve SliderService in SliderDots:', error);
            this.sliderService = null;
        }
    }

    connectedCallback() {
        this.render();
        if (this.sliderService) {
            this.subscribeToService();
            this.initFromService();
        }
    }

    initFromService() {
        // Инициализируем состояние из сервиса
        const slides = this.sliderService.getSlides();
        const index = this.sliderService.getCurrentIndex();

        if (slides.length > 0) {
            this.setSlides(slides);
        }
        this.setCurrentIndex(index);
    }

    subscribeToService() {
        // Подписываемся на изменения слайдов
        this.unsubscribeSlides = this.sliderService.subscribeToSlides((slides) => {
            this.setSlides(slides);
        });

        // Подписываемся на изменения индекса
        this.unsubscribeIndex = this.sliderService.subscribeToIndex((index) => {
            this.setCurrentIndex(index);
        });
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                .slider-dots {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    padding: 20px;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border-radius: 0 0 12px 12px;
                }
                .dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    border: 2px solid white;
                    background: transparent;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .dot.active {
                    background: white;
                    transform: scale(1.2);
                }
                .dot:hover {
                    transform: scale(1.3);
                }
            </style>
            <div class="slider-dots"></div>
        `;
    }

    setSlides(slides) {
        this.slides = slides || [];
        this.renderDots();
    }

    renderDots() {
        const dotsContainer = this.shadowRoot.querySelector('.slider-dots');
        if (!dotsContainer) return;

        dotsContainer.innerHTML = '';

        this.slides.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = 'dot';
            dot.setAttribute('data-index', index);
            dot.setAttribute('aria-label', `Перейти к слайду ${index + 1}`);

            if (index === this.currentIndex) {
                dot.classList.add('active');
            }

            dot.addEventListener('click', () => this.goToSlide(index));
            dotsContainer.appendChild(dot);
        });
    }

    setCurrentIndex(index) {
        this.currentIndex = index;
        this.updateActiveDot();
    }

    updateActiveDot() {
        const dots = this.shadowRoot.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });
    }

    goToSlide(index) {
        if (this.sliderService) {
            this.sliderService.goToSlide(index, this.slides);
        }
    }

    disconnectedCallback() {
        if (this.unsubscribeSlides) {
            this.unsubscribeSlides();
        }
        if (this.unsubscribeIndex) {
            this.unsubscribeIndex();
        }
    }
}

customElements.define('slider-dots', SliderDots);