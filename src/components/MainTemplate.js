class MainTemplate extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    async connectedCallback() {
        try {
            // Можно использовать DI для получения сервисов
            // const sliderService = window.container?.resolve('SliderService');

            const response = await fetch('/src/templates/main.html');
            const html = await response.text();
            this.shadowRoot.innerHTML = `
                <style>
                    :host {
                        display: block;
                    }
                    .app {
                        min-height: 100vh;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    }
                    .header {
                        text-align: center;
                        padding: 2rem;
                        color: white;
                    }
                    .header h1 {
                        margin: 0 0 1rem 0;
                        font-size: 2.5rem;
                    }
                    .header p {
                        font-size: 1.2rem;
                        opacity: 0.9;
                    }
                    .container {
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: 2rem;
                    }
                </style>
                ${html}
            `;
        } catch (error) {
            console.error('Error loading template:', error);
            this.shadowRoot.innerHTML = '<div>Ошибка загрузки шаблона</div>';
        }
    }
}

customElements.define('main-template', MainTemplate);