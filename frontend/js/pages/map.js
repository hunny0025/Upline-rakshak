/* ===== Map Page (Leaflet Offline Vector Maps equivalent) ===== */

// Persist map and marker references
let _uplineMap = null;
let _uplineMarker = null;
let _watchId = null;

function renderMap() {
    const page = document.createElement('div');
    page.className = 'page map-page';
    page.style.display = 'flex';
    page.style.flexDirection = 'column';
    page.style.height = '100dvh';

    page.innerHTML = `
        <div class="page-header" style="flex-shrink: 0; padding-bottom: 10px; z-index: 1000; position: relative;">
            <div style="display:flex; align-items:center; justify-content:space-between;">
                <div>
                    <h1 class="page-title">🗺️ Tactical Map</h1>
                    <p class="page-subtitle">GPS Auto-Centering • Offline Ready</p>
                </div>
                <button class="btn btn-outline" onclick="centerOnGPS()" style="padding: 6px 12px; font-size: 12px; border-color: var(--accent-teal); color: var(--accent-teal);">
                    ⌖ CENTER
                </button>
            </div>
        </div>
        
        <div style="flex: 1; position: relative; width: 100%; border-top: 1px solid var(--border-subtle);">
            <!-- Map Container -->
            <div id="upline-leaflet-map" style="width: 100%; height: 100%; z-index: 1;"></div>
            
            <!-- Dark Tactical Styling applied via CSS Filter -->
            <style>
                /* Invert and hue-rotate Mapnik tiles to match UPLINE dark aesthetic */
                .leaflet-layer,
                .leaflet-control-zoom-in,
                .leaflet-control-zoom-out,
                .leaflet-control-attribution {
                    filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
                }
                .leaflet-container {
                    background: #111 !important;
                }
            </style>
        </div>
        
        <!-- FAB for Resource Pins -->
        <button onclick="addResourcePin()" style="
            position: absolute;
            bottom: 90px;
            right: 20px;
            width: 56px;
            height: 56px;
            border-radius: 28px;
            background: var(--accent-primary);
            color: #fff;
            border: none;
            box-shadow: 0 4px 12px rgba(99,102,241,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            z-index: 1000;
            cursor: pointer;
        ">📍</button>
    `;

    // Initialize map after appending to DOM
    setTimeout(() => {
        initLeafletMap();
    }, 100);

    return page;
}

function initLeafletMap() {
    if (!document.getElementById('upline-leaflet-map')) return;

    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
        showToast('Map library offline. Retrying...');
        setTimeout(initLeafletMap, 500);
        return;
    }

    // Destroy old instance if exists
    if (_uplineMap) {
        _uplineMap.remove();
        _uplineMap = null;
    }

    // Default center (India)
    const defaultCenter = [20.5937, 78.9629];

    _uplineMap = L.map('upline-leaflet-map', {
        zoomControl: false // We will add it to top right
    }).setView(defaultCenter, 5);

    L.control.zoom({ position: 'topright' }).addTo(_uplineMap);

    // Mapnik generic tiles (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19
    }).addTo(_uplineMap);

    // Fetch hospitals dynamically as the user pans/zooms to ensure visibility at all scales
    _uplineMap.on('moveend', () => {
        // Add a slight debounce
        clearTimeout(window._mapMoveTimeout);
        window._mapMoveTimeout = setTimeout(() => {
            fetchNearbyMedicals();
        }, 500);
    });

    centerOnGPS();
}

function centerOnGPS() {
    if (!navigator.geolocation) {
        showToast('GPS not supported by device');
        return;
    }

    showToast('Acquiring GPS Lock...');

    // Clear previous watch
    if (_watchId) navigator.geolocation.clearWatch(_watchId);

    _watchId = navigator.geolocation.watchPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            if (_uplineMap) {
                _uplineMap.setView([lat, lng], 15);

                if (!_uplineMarker) {
                    // Custom pulse icon
                    const pulseIcon = L.divIcon({
                        className: 'custom-pulse-marker',
                        html: '<div style="width:16px;height:16px;background:var(--accent-teal);border-radius:50%;box-shadow:0 0 0 4px rgba(45,212,191,0.3); border:2px solid #fff;"></div>',
                        iconSize: [16, 16],
                        iconAnchor: [8, 8]
                    });
                    _uplineMarker = L.marker([lat, lng], { icon: pulseIcon }).addTo(_uplineMap);
                } else {
                    _uplineMarker.setLatLng([lat, lng]);
                }

                // Fetch medicals if we just locked (only call it once)
                if (!_fetchMedicalsCalled) {
                    _fetchMedicalsCalled = true;
                    // moveend listener will catch this after the setView, but we can also trigger it directly
                    setTimeout(fetchNearbyMedicals, 500);
                }
            }

            // Just center once per manual click, but keep marker updating
            navigator.geolocation.clearWatch(_watchId);
            _watchId = null;
        },
        (err) => {
            console.warn('GPS Error', err);
            showToast('Failed to get GPS. Try outdoors.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

function addResourcePin() {
    if (!_uplineMap) return;

    const center = _uplineMap.getCenter();
    const type = prompt("Resource Type (Water, Food, Medical, Danger):", "Water");

    if (type) {
        L.marker([center.lat, center.lng]).addTo(_uplineMap)
            .bindPopup(`<b>${type}</b><br>Added offline`)
            .openPopup();
        showToast(`Resource Pin saved`);
    }
}

let _fetchMedicalsCalled = false;
const _fetchedMedicalIds = new Set();
let _fetchingMedicals = false;

async function fetchNearbyMedicals() {
    if (!_uplineMap || _fetchingMedicals) return;
    if (localStorage.getItem('upline_forced_offline') === 'true' || !navigator.onLine) {
        return; // Silent abort if strictly offline
    }

    const bounds = _uplineMap.getBounds();
    const s = bounds.getSouthWest().lat;
    const w = bounds.getSouthWest().lng;
    const n = bounds.getNorthEast().lat;
    const e = bounds.getNorthEast().lng;

    _fetchingMedicals = true;

    // Search for hospital, clinic, doctors, pharmacy within bounding box (limit 150 to prevent Overpass crashes on zoom out)
    const query = `[out:json][timeout:10];(node["amenity"~"^(hospital|clinic|doctors|pharmacy)$"](${s},${w},${n},${e});way["amenity"~"^(hospital|clinic|doctors|pharmacy)$"](${s},${w},${n},${e}););out center 150;`;

    try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`
        });

        const data = await response.json();

        if (data.elements && data.elements.length > 0) {
            const medIcon = L.divIcon({
                className: 'custom-med-marker',
                html: '<div style="font-size:20px; line-height: 20px; filter: drop-shadow(0 0 4px rgba(0,0,0,0.8));">🏥</div>',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            let newPlots = 0;
            data.elements.forEach(el => {
                const id = el.id;
                if (_fetchedMedicalIds.has(id)) return;
                _fetchedMedicalIds.add(id);

                const elLat = el.lat || el.center?.lat;
                const elLon = el.lon || el.center?.lon;
                const name = el.tags?.name || 'Medical Facility';
                const type = el.tags?.amenity || 'medical';

                if (elLat && elLon) {
                    L.marker([elLat, elLon], { icon: medIcon }).addTo(_uplineMap)
                        .bindPopup(`<b>${name}</b><br><span style="text-transform:capitalize; font-size:11px; color:#666;">${type}</span>`);
                    newPlots++;
                }
            });
            if (newPlots > 0 && Array.from(_fetchedMedicalIds).length < 200) {
                // Only show toast early on, dont spam user if they keep panning
                showToast(`Plotted ${newPlots} new medical facilities`);
            }
        }
    } catch (e) {
        console.warn('Overpass error:', e);
    } finally {
        _fetchingMedicals = false;
    }
}

// Cleanup on route change
window.addEventListener('hashchange', () => {
    if (window.location.hash !== '#/map') {
        if (_watchId) navigator.geolocation.clearWatch(_watchId);
        _watchId = null;
        _fetchMedicalsCalled = false; // Reset for next time they enter the map
    }
});
