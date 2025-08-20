// main.js
import { container } from './core/DI.js';
import { SliderService } from './services/SliderService.js';
import { CacheService } from './services/CacheService.js';
import { NavigationService } from './services/NavigationService.js';
import { TemplateService } from './services/TemplateService.js';

container.register('CacheService', () => new CacheService(50), { singleton: true });
container.register('NavigationService', () => new NavigationService(), { singleton: true });
container.register('TemplateService', () => new TemplateService(), { singleton: true });
container.register('SliderService', () => new SliderService(), { singleton: true });

window.container = container;

document.addEventListener('DOMContentLoaded', async () => {
    await registerComponents();
    try {
        const sliderService = container.resolve('SliderService');
        await sliderService.initialize();

        sliderService.registerTemplate('image-focused', (slideData) => `
            <div class="slide-content image-focused">
                <div class="slide-image-container">
                    <img src="${slideData.image || '/placeholder.jpg'}"
                         alt="${slideData.title || 'Слайд'}"
                         class="slide-image"
                         onerror="this.src='/placeholder.jpg'">
                </div>
                <div class="slide-info">
                    <h3 class="slide-title">${slideData.title || 'Без названия'}</h3>
                    <p class="slide-description">${slideData.description || 'Описание отсутствует'}</p>
                </div>
            </div>
        `);

        sliderService.registerTemplate('minimal', (slideData) => `
            <div class="slide-content minimal">
                <div class="slide-header">
                    <span class="slide-id">ID: ${slideData.id}</span>
                </div>
                <h3 class="slide-title">${slideData.title || 'Без названия'}</h3>
                <p class="slide-description">${slideData.description || 'Описание отсутствует'}</p>
            </div>
        `);
    } catch (error) {
        console.warn('Could not initialize slider service or register templates:', error);
    }
});

async function registerComponents() {
    await import('./components/main-template/main-template.js');
    await import('./components/custom-slider/custom-slider.js');
    await import('./components/slider/slider-track/slider-track.js');
    await import('./components/slider/slider-controls/slider-controls.js');
    await import('./components/slider/slider-dots/slider-dots.js');
    await import('./components/slider/slider-slide/slider-slide.js');
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Slider Project initialized with fully decomposed services');
    console.log('Registered services:', Array.from(container.services.keys()));
});