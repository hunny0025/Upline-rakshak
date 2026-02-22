/* ===== Hospitals Page — Online + Offline Fallback ===== */

// Offline fallback: major city hospital directories
const OFFLINE_HOSPITALS = [
  { city: 'Delhi', name: 'AIIMS New Delhi', phone: '011-26588500', type: 'Government' },
  { city: 'Delhi', name: 'Safdarjung Hospital', phone: '011-26707444', type: 'Government' },
  { city: 'Mumbai', name: 'KEM Hospital', phone: '022-24107000', type: 'Government' },
  { city: 'Mumbai', name: 'JJ Hospital', phone: '022-23735555', type: 'Government' },
  { city: 'Bangalore', name: 'Bowring & Lady Curzon Hospital', phone: '080-25463896', type: 'Government' },
  { city: 'Bangalore', name: 'Victoria Hospital', phone: '080-26706101', type: 'Government' },
  { city: 'Chennai', name: 'Rajiv Gandhi Government General Hospital', phone: '044-25305000', type: 'Government' },
  { city: 'Kolkata', name: 'SSKM Hospital', phone: '033-22041038', type: 'Government' },
  { city: 'Hyderabad', name: 'Osmania General Hospital', phone: '040-24600121', type: 'Government' },
  { city: 'Pune', name: 'Sassoon General Hospital', phone: '020-26128000', type: 'Government' },
];

function renderHospitals() {
  const page = document.createElement('div');
  page.className = 'page hospitals-page page-scroll';

  const isOnline = navigator.onLine;
  const forcedOffline = localStorage.getItem('upline_forced_offline') === 'true';
  const showOffline = !isOnline || forcedOffline;

  page.innerHTML = `
    <h2>Nearby Hospitals</h2>
    <p style="margin-bottom:var(--space-lg); font-size:var(--font-sm); color:var(--text-secondary);">
      ${showOffline ? 'Offline mode — showing national directory' : 'Finding hospitals near your GPS location...'}
    </p>

    <!-- Always-visible emergency call strip -->
    <div style="
      display:flex;
      gap:var(--space-sm);
      margin-bottom:var(--space-lg);
    ">
      <a href="tel:108" class="btn btn-danger btn-block" style="text-decoration:none;" onclick="if(navigator.vibrate) navigator.vibrate(80)">📞 108 Ambulance</a>
      <a href="tel:112" class="btn btn-ghost btn-block" style="text-decoration:none;">📞 112 Emergency</a>
    </div>

    <div id="hospitals-content">
      ${showOffline ? '' : `
        <div class="empty-state">
          <div class="empty-state-icon" style="animation:spin 2s linear infinite">⏳</div>
          <div class="empty-state-text">Locating nearby hospitals...</div>
        </div>
      `}
    </div>

    ${showOffline ? `
      <!-- Offline city directory -->
      <div class="section-header" style="margin-bottom:var(--space-md);">
        <span class="section-title">National Hospital Directory</span>
      </div>

      <!-- City filter chips -->
      <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:var(--space-lg);">
        ${['All', 'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune'].map(city => `
          <button class="lang-chip ${city === 'All' ? 'active' : ''}" 
                  data-city="${city}" 
                  onclick="filterOfflineHospitals('${city}')"
                  style="font-size:11px;">${city}</button>
        `).join('')}
      </div>

      <div id="offline-hospitals-list">
        ${renderOfflineList('All')}
      </div>
    ` : ''}
  `;

  if (!showOffline) {
    setTimeout(() => findNearbyHospitals(), 100);
  }

  return page;
}

function renderOfflineList(cityFilter) {
  const list = cityFilter === 'All'
    ? OFFLINE_HOSPITALS
    : OFFLINE_HOSPITALS.filter(h => h.city === cityFilter);

  return list.map(h => `
    <div class="hospital-card card" style="border-left:3px solid var(--accent-teal);">
      <div class="hospital-name">🏥 ${h.name}</div>
      <div class="hospital-address">📍 ${h.city} · ${h.type}</div>
      ${h.phone ? `
        <div style="margin-top:var(--space-sm);">
          <a href="tel:${h.phone}" class="btn btn-sm btn-teal" style="text-decoration:none;" onclick="if(navigator.vibrate) navigator.vibrate(50)">📞 ${h.phone}</a>
        </div>
      ` : ''}
    </div>
  `).join('');
}

function filterOfflineHospitals(city) {
  // Update chip states
  document.querySelectorAll('[data-city]').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.city === city);
  });
  const list = document.getElementById('offline-hospitals-list');
  if (list) list.innerHTML = renderOfflineList(city);
}

async function findNearbyHospitals() {
  const container = document.getElementById('hospitals-content');
  if (!container) return;

  // Use real GPS + OpenStreetMap Overpass API for actual nearby hospitals
  if (!navigator.geolocation) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📍</div>
        <div class="empty-state-text">Geolocation not supported by this browser.</div>
      </div>
    `;
    return;
  }

  try {
    const position = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
    );

    const { latitude, longitude } = position.coords;
    const query = `[out:json][timeout:10];(node["amenity"="hospital"](around:5000,${latitude},${longitude});way["amenity"="hospital"](around:5000,${latitude},${longitude}););out center body 10;`;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`
    });

    const data = await response.json();

    if (data.elements && data.elements.length > 0) {
      const hospitals = data.elements
        .map(el => {
          const lat = el.lat || el.center?.lat;
          const lon = el.lon || el.center?.lon;
          const name = el.tags?.name || 'Hospital';
          const addr = el.tags?.['addr:full'] || el.tags?.['addr:street'] || '';
          const phone = el.tags?.phone || el.tags?.['contact:phone'] || '';
          const dist = lat && lon ? getDistance(latitude, longitude, lat, lon) : null;
          return { name, addr, phone, dist, lat, lon };
        })
        .filter(h => h.dist !== null)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 10);

      renderHospitalCards(hospitals);
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🏥</div>
          <div class="empty-state-text">No hospitals found within 5km.<br>Call 108 for ambulance services.</div>
        </div>
      `;
    }
  } catch {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📍</div>
        <div class="empty-state-text">Could not access your location.<br>Enable location services and try again.</div>
      </div>
    `;
  }
}

function renderHospitalCards(hospitals) {
  const container = document.getElementById('hospitals-content');
  if (!container) return;

  container.innerHTML = hospitals.map(h => `
    <div class="hospital-card card">
      <div class="hospital-name">🏥 ${h.name}</div>
      ${h.addr ? `<div class="hospital-address">📍 ${h.addr}</div>` : ''}
      <div class="hospital-distance">◈ ${h.dist < 1 ? `${Math.round(h.dist * 1000)}m away` : `${h.dist.toFixed(1)}km away`}</div>
      <div style="display:flex; gap:var(--space-sm); margin-top:var(--space-md);">
        ${h.phone ? `<a href="tel:${h.phone}" class="btn btn-sm btn-danger" style="text-decoration:none;">📞 Call</a>` : ''}
        <a href="https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}" target="_blank" class="btn btn-sm btn-teal" style="text-decoration:none;">🗺 Directions</a>
      </div>
    </div>
  `).join('');
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
