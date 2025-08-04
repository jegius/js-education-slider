class SliderTrack extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.slides = [];
        this.currentIndex = 0;
        this.isAnimating = false;
        this.unsubscribeSlides = null;
        this.unsubscribeIndex = null;

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
        // Инициализируем слайды при подключении
        const slides = this.sliderService.getSlides();
        if (slides.length > 0) {
            this.setSlides(slides);
        }
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
                    width: 100%;
                }
                .slider-track {
                    display: flex;
                    width: 100%;
                    transition: transform 0.3s ease;
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

        // Очищаем текущие слайды
        track.innerHTML = '';

        // Создаем новые слайды
        this.slides.forEach((_, index) => {
            const slideElement = document.createElement('slider-slide');
            slideElement.setAttribute('data-index', index);
            track.appendChild(slideElement);

            // Подписываем каждый слайд на свои данные
            this.subscribeSlideToData(slideElement, index);
        });
    }

    subscribeSlideToData(slideElement, index) {
        const unsubscribe = this.sliderService.on('slidesChanged', (slides) => {
            if (slides[index]) {
                slideElement.slideData = slides[index];
            }
        });

        // Сохраняем функцию отписки для очистки
        slideElement.unsubscribe = unsubscribe;

        // Передаем начальные данные, если они есть
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
            track.style.transition = 'transform 0.5s ease-in-out';
        }

        setTimeout(() => {
            this.isAnimating = false;
            if (track) {
                track.style.transition = '';
            }
        }, 500);
    }

    getSlideWidth() {
        const firstSlide = this.shadowRoot.querySelector('slider-slide');
        return firstSlide?.offsetWidth || 400;
    }

    disconnectedCallback() {
        // Отписываемся от сервиса
        if (this.unsubscribeSlides) {
            this.unsubscribeSlides();
        }
        if (this.unsubscribeIndex) {
            this.unsubscribeIndex();
        }

        // Отписываем все слайды
        const slideElements = this.shadowRoot.querySelectorAll('slider-slide');
        slideElements.forEach(slide => {
            if (slide.unsubscribe) {
                slide.unsubscribe();
            }
        });
    }
}

customElements.define('slider-track', SliderTrack);