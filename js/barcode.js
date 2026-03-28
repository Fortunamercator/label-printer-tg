const BarcodeGenerator = {
    canvas: null,

    init() {
        this.canvas = document.getElementById('barcode-canvas');
    },

    generate(code, options = {}) {
        const defaults = {
            format: 'EAN13',
            width: 2,
            height: 50,
            displayValue: true,
            fontSize: 14,
            margin: 10,
            background: '#ffffff',
            lineColor: '#000000'
        };

        const settings = { ...defaults, ...options };

        try {
            JsBarcode(this.canvas, code, settings);
            return this.canvas.toDataURL('image/png');
        } catch (error) {
            console.error('Barcode generation error:', error);
            return null;
        }
    },

    generateForLabel(code) {
        return this.generate(code, {
            width: 1.5,
            height: 40,
            fontSize: 12,
            margin: 5
        });
    }
};
