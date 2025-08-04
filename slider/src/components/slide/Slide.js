class SlideItem extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['slide-data'];
    }

    set slideData(data) {
        this._slideData = data;
        this.render();
    }

    get slideData() {
        return this._slideData;
    }

    async connectedCallback() {
        if (!this._slideData) {
            await this.loadTemplate();
        }
    }

    async loadTemplate() {
        const styleResponse = await fetch('/src/components/slide/Slide.css');
        const styles = await styleResponse.text();

        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            <div class="slider-slide">
                <div class="slide-content">
                    <div class="slide-placeholder">
                        <p>Загрузка слайда...</p>
                    </div>
                </div>
            </div>
        `;
    }

    render() {
        if (!this._slideData) return;

        const styleResponse = fetch('/src/components/slide/Slide.css')
            .then(res => res.text())
            .catch(() => '');

        styleResponse.then(styles => {
            this.shadowRoot.innerHTML = `
                <style>${styles}</style>
                <div class="slider-slide">
                    <div class="slide-content">
                        <img src="${this._slideData.image || '/placeholder.jpg'}" 
                             alt="${this._slideData.title || 'Слайд'}"
                             class="slide-image"
                             onerror="this.src='/placeholder.jpg'">
                        <div class="slide-info">
                            <h3 class="slide-title">${this._slideData.title || 'Без названия'}</h3>
                            <p class="slide-description">${this._slideData.description || 'Описание отсутствует'}</p>
                            <div class="slide-meta">
                                <span class="slide-id">ID: ${this._slideData.id}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    }
}

customElements.define('slide-item', SlideItem);