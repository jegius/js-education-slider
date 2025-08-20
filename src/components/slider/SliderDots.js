class SliderDots extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.slides = [];
        this.currentIndex = 0;
        this.unsubscribeSlides = null;
        this.unsubscribeIndex = null;
        this.isNavigating = false;

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
        const slides = this.sliderService.getSlides();
        const index = this.sliderService.getCurrentIndex();

        if (slides.length > 0) {
            this.setSlides(slides);
        }
        this.setCurrentIndex(index);
    }

    subscribeToService() {
        this.unsubscribeSlides = this.sliderService.subscribeToSlides((slides) => {
            this.setSlides(slides);
        });

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
                    gap: 12px;
                    padding: 25px;
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(10px);
                    border-radius: 0 0 12px 12px;
                    border-top: 1px solid rgba(0, 0, 0, 0.1);
                }
                .dot {
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    border: 2px solid #667eea;
                    background: transparent;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
                }
                .dot.active {
                    background: #667eea;
                    border-color: #667eea;
                    transform: scale(1.3);
                }
                .dot:hover {
                    transform: scale(1.4);
                    background: rgba(102, 126, 234, 0.3);
                }
                .dot:active {
                    transform: scale(1.2);
                }
                .dot.navigating {
                    opacity: 0.7;
                    cursor: wait;
                }
                .dot:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
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

            if (this.isNavigating) {
                dot.classList.add('navigating');
                dot.disabled = true;
            }

            // Важно: используем стрелочную функцию для правильного контекста
            dot.addEventListener('click', (e) => {
                e.preventDefault();
                this.goToSlide(index);
            });

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
            dot.classList.remove('navigating');
            dot.disabled = false;
        });
    }

    async goToSlide(index) {
        if (!this.sliderService || this.isNavigating || index === this.currentIndex) return;

        this.isNavigating = true;
        this.updateDotsNavigationState(); // Обновляем визуальное состояние

        try {
            await this.sliderService.goToSlide(index);
        } catch (error) {
            console.error('Error navigating to slide:', error);
        } finally {
            this.isNavigating = false;
            this.updateDotsNavigationState(); // Обновляем визуальное состояние
        }
    }

    updateDotsNavigationState() {
        const dots = this.shadowRoot.querySelectorAll('.dot');
        dots.forEach(dot => {
            if (this.isNavigating) {
                dot.classList.add('navigating');
                dot.disabled = true;
            } else {
                dot.classList.remove('navigating');
                dot.disabled = false;
            }
        });
    }

    disconnectedCallback() {
        const unsubscribes = [this.unsubscribeSlides, this.unsubscribeIndex];
        unsubscribes.forEach(unsubscribe => {
            if (unsubscribe) unsubscribe();
        });
    }
}

customElements.define('slider-dots', SliderDots);