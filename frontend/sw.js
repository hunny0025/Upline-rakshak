/* ===== UPLINE Service Worker — Cache-First Offline Strategy ===== */
const CACHE_NAME = 'upline-v24';

// Forced-offline mode flag — toggled by postMessage from the page
let forcedOffline = false;

// Listen for messages from the page to toggle network mode
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SET_OFFLINE_MODE') {
        forcedOffline = event.data.offline;
        console.log('[SW] forcedOffline =', forcedOffline);
        // Notify all clients of the new state
        self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
                client.postMessage({ type: 'OFFLINE_MODE_CHANGED', offline: forcedOffline });
            });
        });
    }
});

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './css/variables.css',
    './css/base.css',
    './css/components.css',
    './css/pages.css',
    './js/utils/router.js',
    './js/config.js',
    './js/utils/indexeddb.js',
    './js/utils/storage.js',
    './js/engine/symptoms.js',
    './js/engine/triage.js',
    './js/engine/speech.js',
    './js/pages/splash.js',
    './js/pages/dashboard.js',
    './js/pages/voice.js',
    './js/pages/results.js',
    './js/pages/firstaid.js',
    './js/pages/emergency.js',
    './js/pages/network.js',
    './js/pages/hospitals.js',
    './js/pages/settings.js',
    './js/pages/medicalid.js',
    './js/pages/vault.js',
    './js/pages/history.js',
    './js/pages/map.js',
    './js/app.js',
    './js/pages/triage-chat.js',
    './data/symptoms.json',
    './data/rules.json',
    './data/firstaid.json',
    './data/contacts.json',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js'
];

// Install — precache all assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Precaching assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch — cache-first strategy
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Handle external requests (Leaflet, Map tiles, Overpass API)
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) {

        // Dynamic caching for map tiles and Leaflet assets
        if (url.hostname.includes('tile.openstreetmap.org') || url.hostname.includes('unpkg.com')) {
            event.respondWith(
                caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        // Return from cache, but fetch in background to update
                        if (!forcedOffline) {
                            fetch(event.request).then((networkResponse) => {
                                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
                            }).catch(() => { });
                        }
                        return cachedResponse;
                    }
                    if (forcedOffline) {
                        return new Response(null, { status: 404, statusText: 'Offline' });
                    }
                    return fetch(event.request).then((networkResponse) => {
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
                        return networkResponse;
                    }).catch(() => new Response(null, { status: 404 }));
                })
            );
            return;
        }

        // If forced offline, block other external network requests
        if (forcedOffline) {
            event.respondWith(
                Promise.resolve(new Response(JSON.stringify({ error: 'offline' }), {
                    headers: { 'Content-Type': 'application/json' }
                }))
            );
            return;
        }
        // Network-only for other external APIs (like emergency routing)
        event.respondWith(
            fetch(event.request).catch(() => {
                return new Response(JSON.stringify({ error: 'offline' }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            })
        );
        return;
    }

    // Cache-first for local assets
    event.respondWith(
        caches.match(event.request)
            .then((cached) => {
                if (cached) return cached;

                return fetch(event.request).then((response) => {
                    // Cache successful responses
                    if (response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, clone);
                        });
                    }
                    return response;
                });
            })
            .catch(() => {
                // Offline fallback for HTML pages
                if (event.request.headers.get('Accept')?.includes('text/html')) {
                    return caches.match('./index.html');
                }
            })
    );
});
