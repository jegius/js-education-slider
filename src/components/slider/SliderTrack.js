class SliderTrack extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.slides = [];
        this.currentIndex = 0;
        this.isAnimating = false;
        this.unsubscribeSlides = null;
        this.unsubscribeIndex = null;
        this.unsubscribeLoading = null;
        this.isLoading = false;

        try {
            this.sliderService = window.container.resolve('SliderService');
        } catch (error) {
            console.error('Failed to resolve SliderService in SliderTrack:', error);
            this.sliderService = null;
        }
    }

    connectedCallback() {
        this.render();
        if (this.sliderService) {
            this.subscribeToService();
            this.initSlides();
        }
    }

    initSlides() {
        const slides = this.sliderService.getSlides();
        if (slides.length > 0) {
            this.setSlides(slides);
        }
    }

    subscribeToService() {
        this.unsubscribeSlides = this.sliderService.subscribeToSlides((slides) => {
            this.setSlides(slides);
        });

        this.unsubscribeIndex = this.sliderService.subscribeToIndex((index) => {
            this.setCurrentIndex(index);
        });

        this.unsubscribeLoading = this.sliderService.subscribeToLoading((loading) => {
            this.isLoading = loading;
            this.handleLoadingState();
        });
    }

    handleLoadingState() {
        const track = this.shadowRoot.querySelector('.slider-track');
        if (track) {
            track.style.opacity = this.isLoading ? '0.7' : '1';
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                }
                .slider-track {
                    display: flex;
                    width: 100%;
                    transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                .loading-indicator {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 100%;
                    height: 400px;
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    border-radius: 12px;
                    margin: 10px;
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #e9ecef;
                    border-top: 4px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
            <div class="slider-track"></div>
        `;
    }

    setSlides(slides) {
        this.slides = slides || [];
        this.renderSlides();
    }

    renderSlides() {
        const track = this.shadowRoot.querySelector('.slider-track');
        if (!track) return;

        track.innerHTML = '';

        this.slides.forEach((_, index) => {
            const slideElement = document.createElement('slider-slide');
            slideElement.setAttribute('data-index', index);
            track.appendChild(slideElement);

            this.subscribeSlideToData(slideElement, index);
        });

        if (this.isLoading) {
            this.addLoadingIndicator(track);
        }
    }

    addLoadingIndicator(track) {
        const loadingElement = document.createElement('div');
        loadingElement.className = 'loading-indicator';
        loadingElement.innerHTML = `
            <div class="spinner"></div>
        `;
        track.appendChild(loadingElement);
    }

    subscribeSlideToData(slideElement, index) {
        const unsubscribe = this.sliderService.on('slidesChanged', (slides) => {
            if (slides[index]) {
                slideElement.slideData = slides[index];
            }
        });

        slideElement.unsubscribe = unsubscribe;

        const currentSlides = this.sliderService.getSlides();
        if (currentSlides[index]) {
            slideElement.slideData = currentSlides[index];
        }
    }

    setCurrentIndex(index) {
        this.currentIndex = index;
        this.scrollToSlide(index);
    }

    scrollToSlide(index) {
        if (this.isAnimating) return;

        this.isAnimating = true;
        const track = this.shadowRoot.querySelector('.slider-track');
        const slideWidth = this.getSlideWidth();

        if (track) {
            track.style.transform = `translateX(-${index * slideWidth}px)`;
            track.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }

        setTimeout(() => {
            this.isAnimating = false;
            if (track) {
                track.style.transition = '';
            }
        }, 400);
    }

    getSlideWidth() {
        const firstSlide = this.shadowRoot.querySelector('slider-slide');
        return firstSlide?.offsetWidth || 400;
    }

    disconnectedCallback() {
        if (this.unsubscribeSlides) {
            this.unsubscribeSlides();
        }
        if (this.unsubscribeIndex) {
            this.unsubscribeIndex();
        }
        if (this.unsubscribeLoading) {
            this.unsubscribeLoading();
        }

        const slideElements = this.shadowRoot.querySelectorAll('slider-slide');
        slideElements.forEach(slide => {
            if (slide.unsubscribe) {
                slide.unsubscribe();
            }
        });
    }
}

customElements.define('slider-track', SliderTrack);