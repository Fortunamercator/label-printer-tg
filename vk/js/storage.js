const Storage = {
    isVK: false,

    init() {
        this.isVK = typeof vkBridge !== 'undefined';
    },

    async save(key, value) {
        if (this.isVK) {
            try {
                await vkBridge.send('VKWebAppStorageSet', {
                    key: key,
                    value: JSON.stringify(value)
                });
            } catch (e) {
                console.warn('VK Storage save error:', e);
                this.saveLocal(key, value);
            }
        } else {
            this.saveLocal(key, value);
        }
    },

    async load(key) {
        if (this.isVK) {
            try {
                const result = await vkBridge.send('VKWebAppStorageGet', {
                    keys: [key]
                });
                if (result.keys && result.keys.length > 0 && result.keys[0].value) {
                    return JSON.parse(result.keys[0].value);
                }
                return this.loadLocal(key);
            } catch (e) {
                console.warn('VK Storage load error:', e);
                return this.loadLocal(key);
            }
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
