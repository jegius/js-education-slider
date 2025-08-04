class SliderControls extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.sliderService = null;
        this.unsubscribeIndex = null;

        try {
            this.sliderService = window.container.resolve('SliderService');
        } catch (error) {
            console.error('Failed to resolve SliderService in controls:', error);
        }
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        if (this.sliderService) {
            this.subscribeToService();
            this.updateNavigation();
        }
    }

    subscribeToService() {
        // Подписываемся на изменения индекса для обновления состояния кнопок
        this.unsubscribeIndex = this.sliderService.subscribeToIndex(() => {
            this.updateNavigation();
        });
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                .slider-controls {
                    position: absolute;
                    top: 50%;
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                    transform: translateY(-50%);
                    pointer-events: none;
                    z-index: 10;
                }
                .slider-btn {
                    background: rgba(255, 255, 255, 0.9);
                    border: none;
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    font-weight: bold;
                    color: #333;
                    pointer-events: all;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }
                .slider-btn:hover:not(:disabled) {
                    background: white;
                    transform: scale(1.1);
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
                }
                .slider-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }
            </style>
            <div class="slider-controls">
                <button class="slider-btn slider-prev" aria-label="Предыдущий слайд">‹</button>
                <button class="slider-btn slider-next" aria-label="Следующий слайд">›</button>
            </div>
        `;
    }

    setupEventListeners() {
        const prevBtn = this.shadowRoot.querySelector('.slider-prev');
        const nextBtn = this.shadowRoot.querySelector('.slider-next');

        prevBtn?.addEventListener('click', () => this.handlePrevClick());
        nextBtn?.addEventListener('click', () => this.handleNextClick());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.handlePrevClick();
            if (e.key === 'ArrowRight') this.handleNextClick();
        });
    }

    async handleNextClick() {
        if (!this.sliderService) return;

        const slides = this.sliderService.getSlides();
        await this.sliderService.nextSlide(slides);
    }

    async handlePrevClick() {
        if (!this.sliderService) return;

        this.sliderService.prevSlide();
    }

    updateNavigation() {
        if (!this.sliderService) return;

        const prevBtn = this.shadowRoot.querySelector('.slider-prev');
        const nextBtn = this.shadowRoot.querySelector('.slider-next');

        if (prevBtn) {
            prevBtn.disabled = !this.sliderService.canGoPrev();
        }

        if (nextBtn) {
            nextBtn.disabled = false;
        }
    }

    disconnectedCallback() {
        if (this.unsubscribeIndex) {
            this.unsubscribeIndex();
        }

        // Удаляем обработчики событий
        document.removeEventListener('keydown', this.handleKeyDown);
    }
}

customElements.define('slider-controls', SliderControls);