/* ===== UPLINE — Runtime Configuration ===== */
/*
 * On production (Render), this file is served by the static site.
 * On local dev, this falls back to localhost automatically.
 *
 * HOW TO SET YOUR BACKEND URL:
 *   After you deploy the backend to Render, note its URL (e.g. https://upline-backend.onrender.com)
 *   and update UPLINE_BACKEND_URL below.
 */

const UPLINE_CONFIG = {
    // Backend API base URL.
    // Change this string after deploying the backend to Render.
    // Leave as empty string ('') to disable online features and run fully offline.
    BACKEND_URL: (() => {
        // Auto-detect: use same origin in production (if backend & frontend are on same domain),
        // else use localhost for local dev.
        if (typeof window !== 'undefined') {
            const host = window.location.hostname;
            if (host === 'localhost' || host === '127.0.0.1') {
                return 'http://localhost:5000';
            }
            // ──  REPLACE THIS with your actual Render backend URL after first deploy ──
            return 'https://upline-backend.onrender.com';
        }
        return '';
    })(),

    // Feature flags
    ONLINE_SYNC_ENABLED: true,      // Check for rule updates from backend
    HOSPITAL_API_ENABLED: true,     // Try backend hospital API before Overpass
    BACKUP_ENABLED: false,          // Cloud backup (opt-in — privacy first)
};
