/* ===== Web Speech API Wrapper ===== */
const SpeechEngine = {
    recognition: null,
    isListening: false,
    transcript: '',
    interimTranscript: '',
    onResult: null,
    onEnd: null,
    onError: null,
    onStart: null,

    /**
     * Check if speech recognition is supported.
     */
    isSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    },

    /**
     * Initialize speech recognition.
     * @param {string} lang - Language code (e.g., 'en-IN', 'hi-IN')
     */
    init(lang = 'en-IN') {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported in this browser.');
            return false;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = lang;
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
            this.isListening = true;
            if (this.onStart) this.onStart();
        };

        this.recognition.onresult = (event) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    final += result[0].transcript + ' ';
                } else {
                    interim += result[0].transcript;
                }
            }

            if (final) {
                this.transcript += final;
            }
            this.interimTranscript = interim;

            if (this.onResult) {
                this.onResult({
                    final: this.transcript.trim(),
                    interim: this.interimTranscript.trim(),
                    full: (this.transcript + interim).trim()
                });
            }
        };

        this.recognition.onerror = (event) => {
            // Map Web Speech API error codes to human-readable messages
            const ERROR_MESSAGES = {
                'not-allowed':         '⚠️ Microphone access denied. Please allow microphone in browser settings.',
                'permission-denied':   '⚠️ Microphone permission denied. Check browser site settings.',
                'audio-capture':       '🎙️ No microphone found. Please connect a microphone and try again.',
                'aborted':             '⏹️ Listening was stopped.',
                'network':             '🌐 Network error during speech recognition. Retrying…',
                'service-not-allowed': '⚠️ Speech service not allowed. Try using Chrome or Edge.',
                'no-speech':           null,  // silent — auto restart below
                'language-not-supported': '🌍 Selected language not supported on this device.'
            };

            const msg = ERROR_MESSAGES[event.error];
            console.warn('[SpeechEngine] Error:', event.error, msg || '');

            if (this.onError) this.onError(event.error, msg);

            // Auto-restart on transient / recoverable errors
            if ((event.error === 'no-speech' || event.error === 'network') && this.isListening) {
                setTimeout(() => {
                    try { this.recognition.start(); } catch (e) { /* already started */ }
                }, 300);
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
            if (this.onEnd) this.onEnd(this.transcript.trim());
        };

        return true;
    },

    /**
     * Start listening.
     */
    start() {
        if (!this.recognition) return false;

        this.transcript = '';
        this.interimTranscript = '';

        try {
            this.recognition.start();
            return true;
        } catch (e) {
            console.warn('Speech start error:', e);
            return false;
        }
    },

    /**
     * Stop listening.
     */
    stop() {
        if (!this.recognition) return;
        try {
            this.recognition.stop();
        } catch (e) {
            // Ignore
        }
        this.isListening = false;
    },

    /**
     * Change language.
     */
    setLanguage(lang) {
        if (this.recognition) {
            const wasListening = this.isListening;
            if (wasListening) this.stop();
            this.recognition.lang = lang;
            if (wasListening) {
                setTimeout(() => this.start(), 200);
            }
        }
    },

    /**
     * Get the final transcript.
     */
    getTranscript() {
        return this.transcript.trim();
    },

    /**
     * Reset transcript.
     */
    reset() {
        this.transcript = '';
        this.interimTranscript = '';
    }
};

/* ===== Text-to-Speech (TTS) Engine ===== */
const TTS = {
    synth: window.speechSynthesis,
    isSpeaking: false,
    currentUtterance: null,

    /**
     * Get preferred voice for a language code.
     */
    getVoice(langCode) {
        if (!this.synth) return null;
        const voices = this.synth.getVoices();

        // Try exact match
        let voice = voices.find(v => v.lang === langCode);
        if (voice) return voice;

        // Try loose match (e.g., 'hi' for 'hi-IN')
        const shortLang = langCode.split('-')[0];
        voice = voices.find(v => v.lang.startsWith(shortLang));
        if (voice) return voice;

        // Fallback to default
        return voices.find(v => v.default) || voices[0];
    },

    /**
     * Map UPLINE language settings to TTS BCP-47 codes.
     */
    mapLanguageCode(appLang) {
        const map = {
            'en-IN': 'en-IN',
            'hi-IN': 'hi-IN',
            'bn-IN': 'bn-IN',
            'ta-IN': 'ta-IN'
        };
        return map[appLang] || 'en-IN';
    },

    /**
     * Speak text
     * @param {string} text - Text to read aloud
     * @param {function} onEnd - Callback when finished reading
     */
    speak(text, onEnd = null) {
        if (!this.synth) return;

        // Cancel any ongoing speech
        this.stop();

        // Get language from settings
        const appLang = Storage.getLanguage() || 'en-IN';
        const ttsLang = this.mapLanguageCode(appLang);

        this.currentUtterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance.lang = ttsLang;
        this.currentUtterance.rate = 0.9; // Slightly slower for clarity in emergencies

        const voice = this.getVoice(ttsLang);
        if (voice) {
            this.currentUtterance.voice = voice;
        }

        this.currentUtterance.onstart = () => {
            this.isSpeaking = true;
        };

        this.currentUtterance.onend = () => {
            this.isSpeaking = false;
            this.currentUtterance = null;
            if (onEnd) onEnd();
        };

        this.currentUtterance.onerror = (e) => {
            console.warn('TTS Error:', e);
            this.isSpeaking = false;
            this.currentUtterance = null;
        };

        this.synth.speak(this.currentUtterance);
    },

    /**
     * Stop speaking
     */
    stop() {
        if (!this.synth) return;
        this.synth.cancel();
        this.isSpeaking = false;
        this.currentUtterance = null;
    }
};
