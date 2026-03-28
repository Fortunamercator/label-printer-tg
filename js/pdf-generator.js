const PDFGenerator = {
    jsPDF: null,

    init() {
        this.jsPDF = window.jspdf.jsPDF;
    },

    formatDate(dateStr) {
        if (!dateStr) {
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const year = today.getFullYear();
            return `${day}.${month}.${year}`;
        }
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const year = today.getFullYear();
            return `${day}.${month}.${year}`;
        }
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    },

    async generateLabel(template, date, quantity) {
        const labelWidthMM = 58;
        const labelHeightMM = 40;
        
        const formattedDate = this.formatDate(date);
        
        const scale = 4;
        const labelWidthPx = labelWidthMM * scale;
        const labelHeightPx = labelHeightMM * scale;
        
        const canvas = document.createElement('canvas');
        canvas.width = labelWidthPx;
        canvas.height = labelHeightPx;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, labelWidthPx, labelHeightPx);
        
        ctx.fillStyle = '#000000';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(1, 1, labelWidthPx - 2, labelHeightPx - 2);
        
        const margin = 8;
        let y = margin + 12;
        
        ctx.font = 'bold 12px Arial, sans-serif';
        const title = `${template.id} ${template.name}`;
        const titleLines = this.wrapText(ctx, title, labelWidthPx - margin * 2);
        for (const line of titleLines) {
            ctx.fillText(line, margin, y);
            y += 14;
        }
        
        y += 2;
        
        ctx.font = '10px Arial, sans-serif';
        if (template.color) {
            ctx.fillText(`Цвет: ${template.color}`, margin, y);
        }
        
        if (template.size) {
            ctx.font = 'bold 18px Arial, sans-serif';
            const sizeWidth = ctx.measureText(template.size).width;
            ctx.fillText(template.size, labelWidthPx - margin - sizeWidth, y);
        }
        
        ctx.font = '10px Arial, sans-serif';
        y += 14;
        
        if (template.country) {
            ctx.fillText(`Страна: ${template.country}`, margin, y);
            y += 12;
        }
        
        if (template.manufacturer) {
            const mfgLines = template.manufacturer.split('\n');
            ctx.fillText(`Производитель: ${mfgLines[0]}`, margin, y);
            y += 12;
            for (let i = 1; i < mfgLines.length; i++) {
                ctx.fillText(mfgLines[i], margin, y);
                y += 12;
            }
        }
        
        if (template.material) {
            ctx.fillText(`Материал: ${template.material}`, margin, y);
            y += 12;
        }
        
        ctx.fillText(`Дата изготовления: ${formattedDate}`, margin, y);
        y += 16;
        
        if (template.barcode) {
            const barcodeCanvas = document.createElement('canvas');
            try {
                JsBarcode(barcodeCanvas, template.barcode, {
                    format: 'EAN13',
                    width: 2,
                    height: 40,
                    fontSize: 12,
                    margin: 0,
                    displayValue: true
                });
                
                const barcodeWidth = 140;
                const barcodeHeight = 50;
                const barcodeX = (labelWidthPx - barcodeWidth) / 2;
                ctx.drawImage(barcodeCanvas, barcodeX, y, barcodeWidth, barcodeHeight);
            } catch (e) {
                console.error('Barcode error:', e);
            }
        }
        
        const imgData = canvas.toDataURL('image/png', 1.0);
        
        const doc = new this.jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [labelWidthMM, labelHeightMM]
        });

        for (let i = 0; i < quantity; i++) {
            if (i > 0) {
                doc.addPage([labelWidthMM, labelHeightMM], 'landscape');
            }
            doc.addImage(imgData, 'PNG', 0, 0, labelWidthMM, labelHeightMM);
        }

        return doc.output('bloburl');
    },
    
    wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (const word of words) {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    }
};
