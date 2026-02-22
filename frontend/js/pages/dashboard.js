/* ===== Dashboard Page — Peace Mode (HUD) ===== */

let _clockInterval = null;

function renderDashboard() {
  const history = Storage.getHistory();
  const stats = Storage.getStats();
  const isOnline = navigator.onLine;
  const forcedOffline = localStorage.getItem('upline_forced_offline') === 'true';
  const showAsOffline = forcedOffline || !isOnline;

  // Readiness score (0-100) based on activity
  const readiness = Math.min(100, (stats.totalTriages * 10) + (stats.daysActive * 5) + (stats.firstAidViewed * 5));

  const page = document.createElement('div');
  page.className = 'page dashboard-page page-scroll';

  const historyHTML = history.length > 0
    ? history.slice(0, 5).map(h => {
      const urgInfo = TriageEngine.getUrgencyInfo(h.urgency);
      const colors = {
        EMERGENCY: 'var(--color-emergency)',
        URGENT: 'var(--color-urgent)',
        MODERATE: 'var(--color-moderate)',
        LOW: 'var(--accent-teal)'
      };
      return `
                <div class="history-item" onclick="viewHistoryItem(${h.id})">
                    <div class="history-urgency-dot" style="background:${colors[h.urgency] || 'var(--text-muted)'}"></div>
                    <div class="history-info">
                        <div class="history-symptoms">${h.symptoms || 'Unknown symptoms'}</div>
                        <div class="history-time">${getTimeAgo(h.timestamp)}</div>
                    </div>
                    <span class="badge badge-${urgInfo.color} history-badge">${urgInfo.label}</span>
                </div>`;
    }).join('')
    : `<div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div class="empty-state-text">No triage history yet.<br>Start a voice assessment to begin.</div>
           </div>`;

  page.innerHTML = `
        <!-- HUD Header -->
        <div class="dashboard-header">
            <div>
                <div class="dashboard-callsign" id="dashboard-callsign">
                    UPLINE
                    <span>Emergency Triage System</span>
                </div>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
                <button class="status-pill ${showAsOffline ? 'badge-offline-forced' : 'badge-online'}"
                        onclick="toggleNetworkMode()"
                        title="${showAsOffline ? 'Tap to go Online' : 'Tap to go Offline'}"
                        id="network-toggle-btn">
                    <div class="status-dot" style="background:${showAsOffline ? 'var(--color-emergency)' : 'var(--accent-teal)'}"></div>
                    ${showAsOffline ? '✈ OFFLINE' : '◈ ONLINE'}
                </button>
                <!-- Live Clock -->
                <div id="hud-clock" style="
                    font-family: var(--font-display);
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.15em;
                    color: var(--text-muted);
                ">──:──:──</div>
            </div>
        </div>

        <!-- System Status Row -->
        <div class="hud-status-row">
            <div class="hud-stat ${showAsOffline ? 'danger' : 'active'}">
                <div class="hud-stat-dot"></div>
                ${showAsOffline ? 'NET: BLOCKED' : 'NET: LIVE'}
            </div>
            <div class="hud-stat active">
                <div class="hud-stat-dot"></div>
                DB: CACHED
            </div>
            <div class="hud-stat active" id="hud-sw-stat">
                <div class="hud-stat-dot"></div>
                SW: READY
            </div>
            <div class="hud-stat warning" id="hud-gps-stat">
                <div class="hud-stat-dot"></div>
                GPS: STANDBY
            </div>
        </div>

        <!-- Emergency Quick-Call Banner -->
        <a href="tel:108" id="dashboard-call-108"
           onclick="if(navigator.vibrate)navigator.vibrate([100,50,200]); Storage.incrementStat('offlineUses');"
           style="
             display:flex; align-items:center; justify-content:space-between;
             background: linear-gradient(135deg, rgba(239,68,68,0.15), rgba(185,28,28,0.1));
             border: 1px solid rgba(239,68,68,0.4);
             border-radius: var(--radius-md);
             padding: 12px 16px;
             margin-bottom: var(--space-md);
             text-decoration: none; color: inherit;
             position:relative; overflow:hidden;
           ">
          <span style="animation: pulse 2s infinite;" role="img" aria-label="ambulance">🚑</span>
          <div style="flex:1; padding: 0 12px;">
            <div style="font-family:var(--font-display); font-size:11px; font-weight:800; letter-spacing:0.12em; color:#f87171;">CALL 108 — AMBULANCE</div>
            <div style="font-size:10px; color:var(--text-muted); margin-top:1px;">National Emergency • Works offline</div>
          </div>
          <span style="font-family:var(--font-display); font-size:18px; font-weight:800; color:#ef4444;">📞</span>
        </a>

        <!-- Readiness Score -->
        <div style="
            display:flex;
            align-items:center;
            gap:var(--space-md);
            padding: var(--space-sm) var(--space-xs);
            margin-bottom: var(--space-md);
        ">
            <div style="flex:1;">
                <div style="
                    display:flex;
                    justify-content:space-between;
                    font-family:var(--font-display);
                    font-size:9px;
                    letter-spacing:0.12em;
                    color:var(--text-muted);
                    text-transform:uppercase;
                    margin-bottom:4px;
                ">
                    <span>Readiness Score</span>
                    <span style="color:${readiness >= 60 ? 'var(--accent-teal)' : readiness >= 30 ? 'var(--color-gold)' : 'var(--color-emergency)'}">${readiness}%</span>
                </div>
                <div style="height:3px; background:rgba(255,255,255,0.08); border-radius:999px; overflow:hidden;">
                    <div style="
                        height:100%;
                        width:${readiness}%;
                        background: ${readiness >= 60 ? 'var(--accent-teal)' : readiness >= 30 ? 'var(--color-gold)' : 'var(--color-emergency)'};
                        border-radius:999px;
                        transition: width 1s ease;
                    "></div>
                </div>
            </div>
            <div style="
                font-family:var(--font-display);
                font-size:9px;
                text-transform:uppercase;
                letter-spacing:0.1em;
                color:var(--color-gold);
                cursor:pointer;
            " onclick="Router.navigate('/settings')">🏅 ${Storage.getUnlockedBadges().length} Badges</div>
        </div>

        <!-- Hero Card -->
        <div class="hero-card">
            <h2>Symptom Triage</h2>
            <p>Describe symptoms by voice or text. Instant offline assessment — no network required.</p>
            <button class="btn btn-primary btn-lg" onclick="Router.navigate('/voice')" id="start-triage-btn">
                <span class="btn-icon">🎤</span> Begin Voice Triage
            </button>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
            <div class="quick-action-card" onclick="Router.navigate('/hospitals')" id="qa-hospitals">
                <span class="quick-action-icon">🏥</span>
                <div class="quick-action-label">Hospitals</div>
                <div class="quick-action-desc">Find nearby</div>
            </div>
            <div class="quick-action-card" onclick="Router.navigate('/emergency')" id="qa-emergency">
                <span class="quick-action-icon">🚑</span>
                <div class="quick-action-label">Emergency</div>
                <div class="quick-action-desc">Quick call</div>
            </div>
            <div class="quick-action-card" onclick="Router.navigate('/map')" id="qa-map">
                <span class="quick-action-icon">🗺️</span>
                <div class="quick-action-label">Map</div>
                <div class="quick-action-desc">Offline Vector</div>
            </div>
            <div class="quick-action-card" onclick="Router.navigate('/network')" id="qa-network">
                <span class="quick-action-icon">📡</span>
                <div class="quick-action-label">Network</div>
                <div class="quick-action-desc">Mesh & Comms</div>
            </div>
            <div class="quick-action-card" onclick="Router.navigate('/medical-id')" id="qa-medid">
                <span class="quick-action-icon">🪪</span>
                <div class="quick-action-label">Medical ID</div>
                <div class="quick-action-desc">Offline QR Data</div>
            </div>
            <div class="quick-action-card" onclick="Router.navigate('/vault')" id="qa-vault">
                <span class="quick-action-icon">🔒</span>
                <div class="quick-action-label">Secure Vault</div>
                <div class="quick-action-desc">AES Encrypted</div>
            </div>
        </div>

        <!-- Adrenaline Shift Slider -->
        <div class="adrenaline-section" id="adrenaline-section">
            <div class="adrenaline-label">
                <span class="adrenaline-title">⚠ Arm Emergency Mode</span>
                <span class="adrenaline-warn">SLIDE TO ACTIVATE</span>
            </div>
            <div class="adrenaline-slider-wrap" id="adrenaline-wrap">
                <div class="adrenaline-fill" id="adrenaline-fill"></div>
                <div class="adrenaline-text" id="adrenaline-text">▶▶  ACTIVATE EMERGENCY  ▶▶</div>
                <div class="adrenaline-thumb" id="adrenaline-thumb">🆘</div>
                <input type="range" class="adrenaline-input" id="adrenaline-input"
                       min="0" max="100" value="0" step="1"
                       aria-label="Activate Emergency Mode slider">
            </div>
        </div>

        <!-- Triage Stats Row -->
        <div style="
            display:grid;
            grid-template-columns:1fr 1fr 1fr;
            gap:var(--space-sm);
            margin-bottom:var(--space-xl);
        ">
            <div style="
                background:var(--bg-card);
                border:1px solid var(--border-subtle);
                border-radius:var(--radius-md);
                padding:var(--space-md);
                text-align:center;
            ">
                <div style="font-family:var(--font-display); font-size:1.5rem; font-weight:700; color:var(--accent-primary)">${stats.totalTriages || 0}</div>
                <div style="font-family:var(--font-display); font-size:9px; letter-spacing:0.1em; color:var(--text-muted); text-transform:uppercase;">Triages</div>
            </div>
            <div style="
                background:var(--bg-card);
                border:1px solid var(--border-subtle);
                border-radius:var(--radius-md);
                padding:var(--space-md);
                text-align:center;
            ">
                <div style="font-family:var(--font-display); font-size:1.5rem; font-weight:700; color:var(--color-gold)">${Storage.getUnlockedBadges().length}</div>
                <div style="font-family:var(--font-display); font-size:9px; letter-spacing:0.1em; color:var(--text-muted); text-transform:uppercase;">Badges</div>
            </div>
            <div style="
                background:var(--bg-card);
                border:1px solid var(--border-subtle);
                border-radius:var(--radius-md);
                padding:var(--space-md);
                text-align:center;
            ">
                <div style="font-family:var(--font-display); font-size:1.5rem; font-weight:700; color:var(--accent-teal)">${stats.daysActive || 0}</div>
                <div style="font-family:var(--font-display); font-size:9px; letter-spacing:0.1em; color:var(--text-muted); text-transform:uppercase;">Days Active</div>
            </div>
        </div>

        <!-- Disclaimer -->
        <div class="disclaimer-banner">
            ⚠ UPLINE provides first-aid guidance only. It does NOT diagnose diseases.
            Always consult a qualified doctor for medical advice.
        </div>

        <!-- Recent History -->
        <div class="section-header" style="margin-top: var(--space-xl)">
            <span class="section-title">Recent Assessments</span>
            ${history.length > 0 ? '<button class="section-action" onclick="Router.navigate(\'/settings\')">Clear</button>' : ''}
        </div>
        <div id="history-list">${historyHTML}</div>
    `;

  requestAnimationFrame(() => {
    _initAdrenalineSlider();
    _startClock();
    _checkGPS();
  });

  // Clean up clock on page navigation
  page.addEventListener('remove', () => _stopClock());

  return page;
}

/* ===================================================
   Live HUD Clock
   =================================================== */
function _startClock() {
  _stopClock();
  const el = document.getElementById('hud-clock');
  if (!el) return;

  function tick() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    if (el) el.textContent = `${h}:${m}:${s}`;
  }
  tick();
  _clockInterval = setInterval(tick, 1000);
}

function _stopClock() {
  if (_clockInterval) { clearInterval(_clockInterval); _clockInterval = null; }
}

/* ===================================================
   GPS status probe
   =================================================== */
function _checkGPS() {
  const el = document.getElementById('hud-gps-stat');
  if (!el || !navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    () => {
      if (el) {
        el.className = 'hud-stat active';
        el.innerHTML = '<div class="hud-stat-dot"></div>GPS: LOCKED';
      }
    },
    () => {
      if (el) {
        el.className = 'hud-stat warning';
        el.innerHTML = '<div class="hud-stat-dot"></div>GPS: DENIED';
      }
    },
    { timeout: 5000, maximumAge: 30000 }
  );
}

/* ===================================================
   Adrenaline Shift Slider
   =================================================== */
function _initAdrenalineSlider() {
  const input = document.getElementById('adrenaline-input');
  const fill = document.getElementById('adrenaline-fill');
  const thumb = document.getElementById('adrenaline-thumb');
  const text = document.getElementById('adrenaline-text');
  const wrap = document.getElementById('adrenaline-wrap');
  if (!input || !fill || !thumb) return;

  let lastVibStep = -1;

  input.addEventListener('input', () => {
    const pct = parseInt(input.value, 10);
    fill.style.width = pct + '%';

    const wrapW = wrap.offsetWidth;
    const thumbW = 48;
    const padding = 8;
    const travel = wrapW - thumbW - padding * 2;
    thumb.style.left = (padding + (pct / 100) * travel) + 'px';
    thumb.classList.toggle('dragging', pct > 5);
    text.style.opacity = Math.max(0, 1 - pct / 35);

    // Glow the wrap when slider is above 50%
    wrap.classList.toggle('hot', pct >= 50);

    // Progressive haptics — intensity ramps with each 10% step
    const vibStep = Math.floor(pct / 10);
    if (vibStep !== lastVibStep && navigator.vibrate) {
      const duration = Math.round(8 + vibStep * 18); // 8ms → 170ms
      navigator.vibrate(duration);
      lastVibStep = vibStep;
    }
  });

  input.addEventListener('change', () => {
    const pct = parseInt(input.value, 10);
    if (pct >= 98) {
      enterEmergencyMode();
    } else {
      // Snap-back with brief delay
      input.value = 0;
      fill.style.width = '0%';
      thumb.style.transition = 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      thumb.style.left = '8px';
      wrap.classList.remove('hot');
      thumb.classList.remove('dragging');
      text.style.opacity = 1;
      lastVibStep = -1;
      setTimeout(() => { thumb.style.transition = ''; }, 320);
    }
  });
}

/* ===================================================
   Enter Emergency Mode — The Adrenaline Shift
   =================================================== */
function enterEmergencyMode() {
  _stopClock();

  // Stage 1 haptic burst — fast triple hit
  if (navigator.vibrate) navigator.vibrate([60, 30, 60, 30, 60]);

  // Track SOS activation for badge
  Storage.incrementStat('sosActivated');

  // Stage 1: White flash (full viewport)
  const flash = document.createElement('div');
  flash.className = 'screen-flash';
  document.body.appendChild(flash);

  // Stage 2 haptic — long power surge after 120ms
  setTimeout(() => {
    if (navigator.vibrate) navigator.vibrate([200, 60, 300]);
  }, 120);

  // Second flash pulse at 200ms for double-hit feel
  setTimeout(() => {
    const flash2 = document.createElement('div');
    flash2.className = 'screen-flash';
    flash2.style.animationDuration = '250ms';
    document.body.appendChild(flash2);
    setTimeout(() => flash2.remove(), 260);
  }, 200);

  setTimeout(() => flash.remove(), 400);

  // Scale + fade Peace Mode cards out over 800ms
  const page = document.querySelector('.dashboard-page');
  if (page) {
    page.style.transition = 'opacity 800ms cubic-bezier(0.4, 0, 1, 1), transform 800ms cubic-bezier(0.4, 0, 1, 1)';
    page.style.opacity = '0';
    page.style.transform = 'scale(0.90)';
  }

  // Navigate after morph completes
  setTimeout(() => {
    window._emergencyArmed = true;
    Router.navigate('/emergency');
  }, 820);
}

/* ===================================================
   History helpers
   =================================================== */
function viewHistoryItem(id) {
  const history = Storage.getHistory();
  const item = history.find(h => h.id === id);
  if (item && item.resultData) {
    window._lastTriageResult = item.resultData;
    window._lastSymptoms = item.detectedSymptoms || [];
    window._lastInputText = item.symptoms || '';
    Router.navigate('/results');
  }
}

function getTimeAgo(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return then.toLocaleDateString();
}
