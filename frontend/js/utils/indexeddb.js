/* ===== UPLINE IndexedDB Utility ===== */
/* Stores: history, cache (for JSON rules/firstaid from backend) */

const DB = {
    _db: null,
    DB_NAME: 'upline-db',
    DB_VERSION: 1,
    STORES: {
        HISTORY: 'history',
        CACHE: 'json_cache'
    },

    /**
     * Open / initialize the IndexedDB database.
     * Returns a Promise that resolves when ready.
     */
    init() {
        if (this._db) return Promise.resolve(this._db);

        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                console.warn('[DB] IndexedDB not supported — falling back to localStorage only.');
                resolve(null);
                return;
            }

            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // History store — keyed by auto-incremented id
                if (!db.objectStoreNames.contains(this.STORES.HISTORY)) {
                    const histStore = db.createObjectStore(this.STORES.HISTORY, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    histStore.createIndex('timestamp', 'timestamp', { unique: false });
                    histStore.createIndex('urgency', 'urgency', { unique: false });
                }

                // JSON cache store — keyed by string key (e.g. 'rules', 'firstaid')
                if (!db.objectStoreNames.contains(this.STORES.CACHE)) {
                    db.createObjectStore(this.STORES.CACHE, { keyPath: 'key' });
                }
            };

            request.onsuccess = (event) => {
                this._db = event.target.result;
                console.log('[DB] IndexedDB opened successfully.');
                resolve(this._db);
            };

            request.onerror = (event) => {
                console.warn('[DB] IndexedDB open error:', event.target.error);
                resolve(null); // Graceful degradation — don't crash app
            };
        });
    },

    // ── History ────────────────────────────────────────────────────

    /**
     * Add a new history entry.
     * @param {Object} entry - Triage result object
     * @returns {Promise<Object>} - Entry with assigned id
     */
    async addHistory(entry) {
        const db = await this.init();
        if (!db) return entry;

        return new Promise((resolve, reject) => {
            entry.timestamp = entry.timestamp || new Date().toISOString();
            const tx = db.transaction(this.STORES.HISTORY, 'readwrite');
            const store = tx.objectStore(this.STORES.HISTORY);
            const req = store.add(entry);
            req.onsuccess = () => { entry.id = req.result; resolve(entry); };
            req.onerror = () => { console.warn('[DB] addHistory error:', req.error); resolve(entry); };
        });
    },

    /**
     * Get all history entries, newest first.
     * @param {number} limit - Max entries to return (default 50)
     * @returns {Promise<Array>}
     */
    async getHistory(limit = 50) {
        const db = await this.init();
        if (!db) return [];

        return new Promise((resolve) => {
            const tx = db.transaction(this.STORES.HISTORY, 'readonly');
            const store = tx.objectStore(this.STORES.HISTORY);
            const req = store.getAll();
            req.onsuccess = () => {
                const results = (req.result || [])
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .slice(0, limit);
                resolve(results);
            };
            req.onerror = () => { console.warn('[DB] getHistory error:', req.error); resolve([]); };
        });
    },

    /**
     * Delete all history entries.
     */
    async clearHistory() {
        const db = await this.init();
        if (!db) return;

        return new Promise((resolve) => {
            const tx = db.transaction(this.STORES.HISTORY, 'readwrite');
            tx.objectStore(this.STORES.HISTORY).clear();
            tx.oncomplete = resolve;
            tx.onerror = () => resolve();
        });
    },

    // ── JSON Cache (for backend-synced rules, firstaid) ─────────────

    /**
     * Store a JSON payload by key.
     * @param {string} key - Unique cache key (e.g. 'rules', 'firstaid')
     * @param {*} data - JSON-serializable data
     * @param {string} version - Version tag for staleness checks
     */
    async cacheJSON(key, data, version = '') {
        const db = await this.init();
        if (!db) return;

        return new Promise((resolve) => {
            const tx = db.transaction(this.STORES.CACHE, 'readwrite');
            tx.objectStore(this.STORES.CACHE).put({ key, data, version, cachedAt: Date.now() });
            tx.oncomplete = resolve;
            tx.onerror = () => resolve();
        });
    },

    /**
     * Retrieve cached JSON by key.
     * @param {string} key
     * @returns {Promise<{data, version, cachedAt}|null>}
     */
    async getJSON(key) {
        const db = await this.init();
        if (!db) return null;

        return new Promise((resolve) => {
            const tx = db.transaction(this.STORES.CACHE, 'readonly');
            const req = tx.objectStore(this.STORES.CACHE).get(key);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    }
};
