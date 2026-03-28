const Storage = {
    isAvailable: false,

    init() {
        this.isAvailable = window.Telegram?.WebApp?.CloudStorage !== undefined;
    },

    async save(key, value) {
        if (this.isAvailable) {
            return new Promise((resolve) => {
                window.Telegram.WebApp.CloudStorage.setItem(key, JSON.stringify(value), (error) => {
                    if (error) {
                        console.warn('CloudStorage save error:', error);
                        this.saveLocal(key, value);
                    }
                    resolve();
                });
            });
        } else {
            this.saveLocal(key, value);
        }
    },

    async load(key) {
        if (this.isAvailable) {
            return new Promise((resolve) => {
                window.Telegram.WebApp.CloudStorage.getItem(key, (error, value) => {
                    if (error || !value) {
                        resolve(this.loadLocal(key));
                    } else {
                        try {
                            resolve(JSON.parse(value));
                        } catch {
                            resolve(null);
                        }
                    }
                });
            });
        } else {
            return this.loadLocal(key);
        }
    },

    saveLocal(key, value) {
        try {
            localStorage.setItem('label_' + key, JSON.stringify(value));
        } catch (e) {
            console.warn('localStorage save error:', e);
        }
    },

    loadLocal(key) {
        try {
            const value = localStorage.getItem('label_' + key);
            return value ? JSON.parse(value) : null;
        } catch {
            return null;
        }
    },

    async saveLastValues(templateId, quantity) {
        await this.save('lastValues', { templateId, quantity });
    },

    async loadLastValues() {
        return await this.load('lastValues');
    }
};

Storage.init();
