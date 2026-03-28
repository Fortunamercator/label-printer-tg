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

    generateLabel(template, date, quantity) {
        const labelWidth = 58;
        const labelHeight = 40;
        
        const doc = new this.jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [labelWidth, labelHeight]
        });

        const formattedDate = this.formatDate(date);

        for (let i = 0; i < quantity; i++) {
            if (i > 0) {
                doc.addPage([labelWidth, labelHeight], 'landscape');
            }
            this.drawLabel(doc, template, formattedDate, labelWidth, labelHeight);
        }

        return doc.output('bloburl');
    },

    drawLabel(doc, template, date, width, height) {
        const margin = 2;
        const lineHeight = 3.5;
        let y = margin + 1;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        
        const title = `${template.id} ${template.name}`;
        const titleLines = doc.splitTextToSize(title, width - margin * 2);
        doc.text(titleLines, margin, y);
        y += titleLines.length * lineHeight;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);

        if (template.color) {
            doc.text(`Цвет: ${template.color}`, margin, y);
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(template.size, width - margin, y, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            y += lineHeight;
        }

        y += 1;

        if (template.country) {
            doc.text(`Страна: ${template.country}`, margin, y);
            y += lineHeight;
        }

        if (template.manufacturer) {
            const mfgLines = template.manufacturer.split('\n');
            doc.text(`Производитель: ${mfgLines[0]}`, margin, y);
            y += lineHeight;
            
            for (let i = 1; i < mfgLines.length; i++) {
                doc.text(mfgLines[i], margin, y);
                y += lineHeight;
            }
        }

        if (template.material) {
            doc.text(`Материал: ${template.material}`, margin, y);
            y += lineHeight;
        }

        doc.text(`Дата изготовления: ${date}`, margin, y);
        y += lineHeight + 1;

        if (template.barcode) {
            const barcodeImg = BarcodeGenerator.generateForLabel(template.barcode);
            if (barcodeImg) {
                const barcodeWidth = 35;
                const barcodeHeight = 10;
                const barcodeX = (width - barcodeWidth) / 2;
                
                try {
                    doc.addImage(barcodeImg, 'PNG', barcodeX, y, barcodeWidth, barcodeHeight);
                } catch (e) {
                    console.error('Error adding barcode to PDF:', e);
                }
            }
        }

        doc.setDrawColor(0);
        doc.setLineWidth(0.2);
        doc.rect(0.5, 0.5, width - 1, height - 1);
    }
};
