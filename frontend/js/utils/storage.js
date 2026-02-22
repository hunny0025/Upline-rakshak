/* ===== Local Storage Wrapper + Gamification ===== */
const Storage = {
    PREFIX: 'upline_',

    get(key, fallback = null) {
        try {
            const raw = localStorage.getItem(this.PREFIX + key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
        } catch (e) {
            console.warn('Storage write failed:', e);
        }
    },

    remove(key) {
        localStorage.removeItem(this.PREFIX + key);
    },

    // --- Settings ---
    getSettings() {
        return this.get('settings', {
            theme: 'dark',
            language: 'en-IN',
            voiceEnabled: true,
            emergencyName: '',
            emergencyPhone: ''
        });
    },

    saveSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        this.set('settings', settings);
    },

    // --- Triage History ---
    getHistory() {
        return this.get('history', []);
    },

    addHistory(entry) {
        const history = this.getHistory();
        entry.id = entry.id || Date.now();
        entry.timestamp = entry.timestamp || new Date().toISOString();
        history.unshift(entry);
        if (history.length > 50) history.pop();
        this.set('history', history);
        // Also write to IndexedDB (async, fire-and-forget)
        if (typeof DB !== 'undefined') {
            DB.addHistory({ ...entry }).catch(() => { });
        }
        // Update stats
        this._incrementStat('totalTriages');
        if (entry.urgency === 'EMERGENCY') this._incrementStat('emergencyCount');
        return entry;
    },

    clearHistory() {
        this.set('history', []);
    },

    // --- Stats ---
    getStats() {
        return this.get('stats', {
            totalTriages: 0,
            emergencyCount: 0,
            firstAidViewed: 0,
            daysActive: 0,
            lastActiveDate: null
        });
    },

    _incrementStat(key) {
        const stats = this.getStats();
        stats[key] = (stats[key] || 0) + 1;
        // Track days active
        const today = new Date().toDateString();
        if (stats.lastActiveDate !== today) {
            stats.daysActive = (stats.daysActive || 0) + 1;
            stats.lastActiveDate = today;
        }
        this.set('stats', stats);
        this._checkBadges(stats);
    },

    incrementStat(key) {
        this._incrementStat(key);
    },

    // --- Badges (Gamification) ---
    BADGE_DEFINITIONS: [
        { id: 'first_triage', icon: '🎯', name: 'First Responder', desc: 'Completed your first triage', condition: s => s.totalTriages >= 1 },
        { id: 'five_triages', icon: '⚡', name: 'Quick Thinker', desc: 'Completed 5 triage assessments', condition: s => s.totalTriages >= 5 },
        { id: 'ten_triages', icon: '🏥', name: 'Field Medic', desc: 'Completed 10 triage assessments', condition: s => s.totalTriages >= 10 },
        { id: 'first_aid_fan', icon: '🩹', name: 'First Aid Fan', desc: 'Viewed 3 first aid guides', condition: s => s.firstAidViewed >= 3 },
        { id: 'prepared', icon: '🛡️', name: 'Always Prepared', desc: 'Active for 3 days', condition: s => s.daysActive >= 3 },
        { id: 'vigilant', icon: '👁️', name: 'Vigilant', desc: 'Active for 7 days', condition: s => s.daysActive >= 7 },
        { id: 'sos_activated', icon: '🆘', name: 'SOS Activated', desc: 'Used Adrenaline Shift Emergency Mode', condition: s => s.sosActivated >= 1 },
        { id: 'offline_hero', icon: '📡', name: 'Offline Hero', desc: 'Used UPLINE while offline', condition: s => s.offlineUses >= 1 },
    ],

    getUnlockedBadges() {
        return this.get('badges', []);
    },

    _checkBadges(stats) {
        const unlocked = new Set(this.getUnlockedBadges());
        const newlyUnlocked = [];

        for (const badge of this.BADGE_DEFINITIONS) {
            if (!unlocked.has(badge.id) && badge.condition(stats)) {
                unlocked.add(badge.id);
                newlyUnlocked.push(badge);
            }
        }

        if (newlyUnlocked.length > 0) {
            this.set('badges', [...unlocked]);
            // Queue badge notifications
            const queue = this.get('badge_queue', []);
            newlyUnlocked.forEach(b => queue.push(b));
            this.set('badge_queue', queue);
        }
    },

    popBadgeQueue() {
        const queue = this.get('badge_queue', []);
        if (queue.length === 0) return null;
        const next = queue.shift();
        this.set('badge_queue', queue);
        return next;
    },

    // --- Theme ---
    getTheme() {
        return this.getSettings().theme || 'dark';
    },

    setTheme(theme) {
        this.saveSetting('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    },

    // --- Language ---
    getLanguage() {
        return this.getSettings().language || 'en-IN';
    },

    setLanguage(lang) {
        this.saveSetting('language', lang);
    }
};
