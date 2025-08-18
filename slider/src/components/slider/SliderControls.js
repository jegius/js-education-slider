class SliderControls extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.sliderService = null;
        this.unsubscribeIndex = null;
        this.unsubscribeHasMore = null;
        this.unsubscribeLoading = null;
        this.unsubscribeSlides = null;
        this.hasMore = true;
        this.isLoading = false;
        this.slides = [];

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
        this.unsubscribeIndex = this.sliderService.subscribeToIndex(() => {
            this.updateNavigation();
        });

        this.unsubscribeHasMore = this.sliderService.subscribeToHasMore((hasMore) => {
            this.hasMore = hasMore;
            this.updateNavigation();
        });

        this.unsubscribeLoading = this.sliderService.subscribeToLoading((loading) => {
            this.isLoading = loading;
            this.updateNavigation();
        });

        this.unsubscribeSlides = this.sliderService.subscribeToSlides((slides) => {
            this.slides = slides;
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
                    width: calc(100% + 80px);
                    display: flex;
                    justify-content: space-between;
                    transform: translateY(-50%);
                    pointer-events: none;
                    z-index: 10;
                    left: -40px;
                }
                .slider-btn {
                    background: rgba(255, 255, 255, 0.95);
                    border: 2px solid #667eea;
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    font-weight: bold;
                    color: #667eea;
                    pointer-events: all;
                    transition: all 0.3s ease;
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
                }
                .slider-btn:hover:not(:disabled) {
                    background: white;
                    transform: scale(1.1);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
                    color: #764ba2;
                }
                .slider-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                    background: rgba(200, 200, 200, 0.7);
                    border-color: #ccc;
                    color: #999;
                }
                .slider-btn.loading {
                    opacity: 0.7;
                    cursor: wait;
                }
                .spinner {
                    width: 24px;
                    height: 24px;
                    border: 3px solid rgba(102, 126, 234, 0.3);
                    border-top: 3px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
            <div class="slider-controls">
                <button class="slider-btn slider-prev" aria-label="Предыдущий слайд">‹</button>
                <button class="slider-btn slider-next" aria-label="Следующий слайд">
                    <span class="btn-text">›</span>
                </button>
            </div>
        `;
    }

    setupEventListeners() {
        const prevBtn = this.shadowRoot.querySelector('.slider-prev');
        const nextBtn = this.shadowRoot.querySelector('.slider-next');

        prevBtn?.addEventListener('click', () => this.handlePrevClick());
        nextBtn?.addEventListener('click', () => this.handleNextClick());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.handlePrevClick();
            if (e.key === 'ArrowRight') this.handleNextClick();
        });
    }

    async handleNextClick() {
        if (!this.sliderService || this.isLoading) return;

        try {
            await this.sliderService.nextSlide();
        } catch (error) {
            console.error('Error in next slide:', error);
        }
    }

    async handlePrevClick() {
        if (!this.sliderService || this.isLoading) return;

        try {
            await this.sliderService.prevSlide();
        } catch (error) {
            console.error('Error in prev slide:', error);
        }
    }

    updateNavigation() {
        if (!this.sliderService) return;

        const prevBtn = this.shadowRoot.querySelector('.slider-prev');
        const nextBtn = this.shadowRoot.querySelector('.slider-next');
        const btnText = nextBtn?.querySelector('.btn-text');

        const currentIndex = this.sliderService.getCurrentIndex();
        const slides = this.sliderService.getSlides();
        const hasMore = this.sliderService.hasMoreSlides();

        if (prevBtn) {
            const canGoPrev = currentIndex > 0;
            prevBtn.disabled = !canGoPrev || this.isLoading;
        }

        if (nextBtn) {
            // Улучшенная логика: можно идти вперед если есть следующий слайд или есть еще слайды для загрузки
            const canGoNext = currentIndex < slides.length - 1 || (hasMore && slides.length > 0);
            nextBtn.disabled = !canGoNext || this.isLoading;

            if (btnText) {
                if (this.isLoading) {
                    btnText.innerHTML = '<div class="spinner"></div>';
                } else {
                    btnText.textContent = '›';
                }
            }
        }
    }

    disconnectedCallback() {
        const unsubscribes = [
            this.unsubscribeIndex,
            this.unsubscribeHasMore,
            this.unsubscribeLoading,
            this.unsubscribeSlides
        ];

        unsubscribes.forEach(unsubscribe => {
            if (unsubscribe) unsubscribe();
        });

        document.removeEventListener('keydown', this.handleKeyDown);
    }
}

customElements.define('slider-controls', SliderControls);