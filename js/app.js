const App = {
    templates: [],
    currentPdfUrl: null,

    elements: {
        formScreen: null,
        previewScreen: null,
        templateSelect: null,
        quantity: null,
        date: null,
        generateBtn: null,
        backBtn: null,
        printBtn: null,
        pdfPreview: null,
        loading: null
    },

    async init() {
        this.initTelegram();
        this.cacheElements();
        this.bindEvents();
        BarcodeGenerator.init();
        PDFGenerator.init();
        
        await this.loadTemplates();
        await this.restoreLastValues();
        
        this.setDefaultDate();
        this.updateGenerateButton();
    },

    initTelegram() {
        if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();
            
            document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
            document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000');
            document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#999999');
            document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#2481cc');
            document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');
            document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', tg.themeParams.secondary_bg_color || '#f0f0f0');
        }
    },

    cacheElements() {
        this.elements.formScreen = document.getElementById('form-screen');
        this.elements.previewScreen = document.getElementById('preview-screen');
        this.elements.templateSelect = document.getElementById('template-select');
        this.elements.quantity = document.getElementById('quantity');
        this.elements.date = document.getElementById('date');
        this.elements.generateBtn = document.getElementById('generate-btn');
        this.elements.backBtn = document.getElementById('back-btn');
        this.elements.printBtn = document.getElementById('print-btn');
        this.elements.pdfPreview = document.getElementById('pdf-preview');
        this.elements.loading = document.getElementById('loading');
    },

    bindEvents() {
        this.elements.templateSelect.addEventListener('change', () => {
            this.updateGenerateButton();
            this.saveCurrentValues();
        });
        
        this.elements.quantity.addEventListener('change', () => {
            this.saveCurrentValues();
        });
        
        this.elements.generateBtn.addEventListener('click', () => this.generatePDF());
        this.elements.backBtn.addEventListener('click', () => this.showForm());
        this.elements.printBtn.addEventListener('click', () => this.printPDF());
    },

    async loadTemplates() {
        try {
            const response = await fetch('data/templates.json');
            const data = await response.json();
            this.templates = data.templates;
            this.populateTemplateSelect();
        } catch (error) {
            console.error('Error loading templates:', error);
            this.elements.templateSelect.innerHTML = '<option value="">Ошибка загрузки</option>';
        }
    },

    populateTemplateSelect() {
        this.elements.templateSelect.innerHTML = '<option value="">Выберите товар...</option>';
        
        this.templates.forEach(template => {
            const option = document.createElement('option');
            option.value = template.id;
            option.textContent = `${template.id} — ${template.name}`;
            this.elements.templateSelect.appendChild(option);
        });
    },

    setDefaultDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        this.elements.date.value = `${year}-${month}-${day}`;
    },

    async restoreLastValues() {
        const lastValues = await Storage.loadLastValues();
        if (lastValues) {
            if (lastValues.templateId) {
                this.elements.templateSelect.value = lastValues.templateId;
            }
            if (lastValues.quantity) {
                this.elements.quantity.value = lastValues.quantity;
            }
        }
    },

    async saveCurrentValues() {
        const templateId = this.elements.templateSelect.value;
        const quantity = this.elements.quantity.value;
        await Storage.saveLastValues(templateId, quantity);
    },

    updateGenerateButton() {
        const hasTemplate = this.elements.templateSelect.value !== '';
        this.elements.generateBtn.disabled = !hasTemplate;
    },

    showLoading(show) {
        if (show) {
            this.elements.loading.classList.remove('hidden');
        } else {
            this.elements.loading.classList.add('hidden');
        }
    },

    showForm() {
        this.elements.previewScreen.classList.remove('active');
        this.elements.formScreen.classList.add('active');
        
        if (this.currentPdfUrl) {
            URL.revokeObjectURL(this.currentPdfUrl);
            this.currentPdfUrl = null;
        }
    },

    showPreview() {
        this.elements.formScreen.classList.remove('active');
        this.elements.previewScreen.classList.add('active');
    },

    async generatePDF() {
        const templateId = this.elements.templateSelect.value;
        const template = this.templates.find(t => t.id === templateId);
        
        if (!template) {
            alert('Выберите товар');
            return;
        }

        const quantity = parseInt(this.elements.quantity.value) || 1;
        const date = this.elements.date.value;

        this.showLoading(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const pdfUrl = await PDFGenerator.generateLabel(template, date, quantity);
            this.currentPdfUrl = pdfUrl;
            
            this.elements.pdfPreview.src = pdfUrl;
            
            this.showPreview();
        } catch (error) {
            console.error('PDF generation error:', error);
            alert('Ошибка при создании PDF');
        } finally {
            this.showLoading(false);
        }
    },

    printPDF() {
        if (this.currentPdfUrl) {
            if (window.Telegram?.WebApp?.openLink) {
                window.Telegram.WebApp.openLink(this.currentPdfUrl);
            } else {
                const link = document.createElement('a');
                link.href = this.currentPdfUrl;
                link.target = '_blank';
                link.click();
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
