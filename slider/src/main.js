// Импортируем DI контейнер
import { container } from './core/DI.js';
import { SliderService } from './services/SliderService.js';

// Регистрируем сервисы в DI контейнере
container.register('SliderService', () => new SliderService(), { singleton: true });

// Делаем контейнер доступным глобально
window.container = container;

// Импортируем все компоненты
import './components/MainTemplate.js';
import './components/slider/Slider.js';
import './components/slider/SliderTrack.js';
import './components/slider/SliderControls.js';
import './components/slider/SliderDots.js';
import './components/slider/SliderSlide.js';

// Дополнительная инициализация
document.addEventListener('DOMContentLoaded', () => {
    console.log('Slider Project initialized with DI, EventEmitter and decomposed components');
    console.log('Registered services:', Array.from(container.services.keys()));
});