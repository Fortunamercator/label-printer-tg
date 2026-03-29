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
        await this.initVK();
        this.cacheElements();
        this.bindEvents();
        BarcodeGenerator.init();
        PDFGenerator.init();
        
        await this.loadTemplates();
        await this.restoreLastValues();
        
        this.setDefaultDate();
        this.updateGenerateButton();
    },

    async initVK() {
        if (typeof vkBridge !== 'undefined') {
            try {
                await vkBridge.send('VKWebAppInit');
                
                vkBridge.subscribe((event) => {
                    if (event.detail.type === 'VKWebAppUpdateConfig') {
                        const scheme = event.detail.data.scheme;
                        this.applyTheme(scheme);
                    }
                });
                
                const config = await vkBridge.send('VKWebAppGetConfig');
                if (config.scheme) {
                    this.applyTheme(config.scheme);
                }
            } catch (e) {
                console.warn('VK Bridge init error:', e);
            }
        }
    },

    applyTheme(scheme) {
        if (scheme === 'space_gray' || scheme === 'vkcom_dark') {
            document.documentElement.style.setProperty('--vk-bg-color', '#19191a');
            document.documentElement.style.setProperty('--vk-text-color', '#e1e3e6');
            document.documentElement.style.setProperty('--vk-hint-color', '#76787a');
            document.documentElement.style.setProperty('--vk-secondary-bg-color', '#232324');
        } else {
            document.documentElement.style.setProperty('--vk-bg-color', '#ffffff');
            document.documentElement.style.setProperty('--vk-text-color', '#000000');
            document.documentElement.style.setProperty('--vk-hint-color', '#818c99');
            document.documentElement.style.setProperty('--vk-secondary-bg-color', '#f5f5f5');
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

    async printPDF() {
        if (!this.currentPdfUrl) return;
        
        try {
            const response = await fetch(this.currentPdfUrl);
            const blob = await response.blob();
            const file = new File([blob], 'etiquette.pdf', { type: 'application/pdf' });
            
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Этикетка',
                    text: 'Сохраните или отправьте на печать'
                });
            } else if (typeof vkBridge !== 'undefined') {
                try {
                    await vkBridge.send('VKWebAppDownloadFile', {
                        url: this.currentPdfUrl,
                        filename: 'etiquette.pdf'
                    });
                } catch (e) {
                    const link = document.createElement('a');
                    link.href = this.currentPdfUrl;
                    link.download = 'etiquette.pdf';
                    link.click();
                }
            } else {
                const link = document.createElement('a');
                link.href = this.currentPdfUrl;
                link.download = 'etiquette.pdf';
                link.click();
            }
        } catch (e) {
            console.error('Share error:', e);
            alert('Сделайте скриншот для сохранения');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
