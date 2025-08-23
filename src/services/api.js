const API_BASE_URL = '/api';
const MOCK_DATA_URL = '/mock-data.json';
class ApiService {
    constructor() {
        this.baseUrl = API_BASE_URL;
    }
    async fetchSlides(offset = 0, limit = 10) {
        try {
            const response = await fetch(MOCK_DATA_URL);
            if (response.ok) {
                const data = await response.json();
                return data.slides.slice(offset, offset + limit);
            }
            return this.generateMockSlides(offset, limit);
        } catch (error) {
            console.warn('Using mock ', error);
            return this.generateMockSlides(offset, limit);
        }
    }
    async fetchSlideById(id) {
        try {
            const response = await fetch(`${this.baseUrl}/slides/${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching slide:', error);
            throw error;
        }
    }
    generateMockSlides(offset, limit) {
        const slides = [];
        for (let i = offset; i < offset + limit; i++) {
            slides.push({
                id: i + 1,
                title: `Слайд ${i + 1}`,
                description: `Это демонстрационный слайд номер ${i + 1}. Здесь может быть любая информация, которую вы хотите показать пользователям.`,
                image: `https://picsum.photos/600/300?random=${i + 1}`,
                createdAt: new Date().toISOString()
            });
        }
        return slides;
    }
}
export const apiService = new ApiService();
export const fetchSlides = (offset = 0, limit = 10) =>
    apiService.fetchSlides(offset, limit);
export const fetchSlideById = (id) =>
    apiService.fetchSlideById(id);