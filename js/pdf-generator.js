const PDFGenerator = {
    jsPDF: null,

    init() {
        this.jsPDF = window.jspdf.jsPDF;
    },

    formatDate(dateStr) {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    },

    fillLabelTemplate(template, date) {
        const formattedDate = this.formatDate(date);
        
        document.getElementById('label-title').textContent = `${template.id} ${template.name}`;
        document.getElementById('label-color').textContent = template.color ? `Цвет: ${template.color}` : '';
        document.getElementById('label-size').textContent = template.size || '';
        document.getElementById('label-country').textContent = template.country ? `Страна: ${template.country}` : '';
        
        const mfgEl = document.getElementById('label-manufacturer');
        if (template.manufacturer) {
            const lines = template.manufacturer.split('\n');
            mfgEl.innerHTML = `Производитель: ${lines[0]}${lines.length > 1 ? '<br>' + lines.slice(1).join('<br>') : ''}`;
        } else {
            mfgEl.textContent = '';
        }
        
        document.getElementById('label-material').textContent = template.material ? `Материал: ${template.material}` : '';
        document.getElementById('label-date').textContent = `Дата изготовления: ${formattedDate}`;
        
        if (template.barcode) {
            try {
                JsBarcode('#label-barcode', template.barcode, {
                    format: 'EAN13',
                    width: 1.2,
                    height: 30,
                    fontSize: 10,
                    margin: 2
                });
            } catch (e) {
                console.error('Barcode error:', e);
            }
        }
    },

    async generateLabel(template, date, quantity) {
        const labelWidth = 58;
        const labelHeight = 40;
        
        this.fillLabelTemplate(template, date);
        
        const labelContent = document.getElementById('label-content');
        
        const canvas = await html2canvas(labelContent, {
            scale: 3,
            backgroundColor: '#ffffff',
            logging: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        const doc = new this.jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [labelWidth, labelHeight]
        });

        for (let i = 0; i < quantity; i++) {
            if (i > 0) {
                doc.addPage([labelWidth, labelHeight], 'landscape');
            }
            doc.addImage(imgData, 'PNG', 0, 0, labelWidth, labelHeight);
        }

        return doc.output('bloburl');
    }
};
