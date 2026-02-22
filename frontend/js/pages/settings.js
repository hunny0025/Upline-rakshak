/* ===== Settings Page — Full Featured ===== */
function renderSettings() {
  const page = document.createElement('div');
  page.className = 'page settings-page page-scroll';

  const settings = Storage.getSettings();
  const stats = Storage.getStats();
  const historyCount = Storage.getHistory().length;
  const unlockedBadges = Storage.getUnlockedBadges();
  const allBadges = Storage.BADGE_DEFINITIONS;
  const isDark = settings.theme === 'dark';

  const LANGS = [
    { code: 'en-IN', flag: '🇬🇧', label: 'English', desc: 'Voice recognition language' },
    { code: 'hi-IN', flag: '🇮🇳', label: 'हिन्दी', desc: 'Hindi — बोलें हिन्दी में' },
    { code: 'ta-IN', flag: '🇮🇳', label: 'தமிழ்', desc: 'Tamil' },
    { code: 'te-IN', flag: '🇮🇳', label: 'తెలుగు', desc: 'Telugu' },
    { code: 'bn-IN', flag: '🇮🇳', label: 'বাংলা', desc: 'Bengali' },
  ];

  page.innerHTML = `
    <h2>⚙ Settings</h2>

    <!-- === Appearance === -->
    <div class="settings-group">
      <div class="settings-group-title">Appearance</div>
      <div class="settings-item">
        <div class="settings-item-left">
          <span class="settings-item-icon">${isDark ? '🌙' : '☀️'}</span>
          <div>
            <div class="settings-item-label">Dark Mode</div>
            <div class="settings-item-desc">Easier on eyes in low light</div>
          </div>
        </div>
        <label class="toggle">
          <input type="checkbox" ${isDark ? 'checked' : ''} onchange="toggleTheme(this.checked)" id="theme-toggle">
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>

    <!-- === Language === -->
    <div class="settings-group">
      <div class="settings-group-title">Voice Language</div>
      ${LANGS.map(l => `
        <div class="settings-item" onclick="setSettingsLang('${l.code}')" style="cursor:pointer;">
          <div class="settings-item-left">
            <span class="settings-item-icon">${l.flag}</span>
            <div>
              <div class="settings-item-label">${l.label}</div>
              <div class="settings-item-desc">${l.desc}</div>
            </div>
          </div>
          <span style="color:${settings.language === l.code ? 'var(--accent-primary)' : 'var(--text-muted)'}; font-size:18px;">
            ${settings.language === l.code ? '●' : '○'}
          </span>
        </div>
      `).join('')}
    </div>

    <!-- === Emergency Contact === -->
    <div class="settings-group">
      <div class="settings-group-title">Personal Emergency Contact</div>
      <div style="padding:var(--space-md) var(--space-lg); background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-md); margin-bottom:var(--space-sm);">
        <div style="margin-bottom:var(--space-sm);">
          <label style="font-size:var(--font-xs); color:var(--text-muted); font-family:var(--font-display); letter-spacing:0.1em; text-transform:uppercase; display:block; margin-bottom:4px;">Contact Name</label>
          <input type="text" id="em-name" placeholder="e.g., Spouse, Parent" value="${settings.emergencyName || ''}"
            style="width:100%; background:var(--bg-glass); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:10px 14px; color:var(--text-primary); font-size:var(--font-sm);"
            oninput="saveEmergencyContact()">
        </div>
        <div>
          <label style="font-size:var(--font-xs); color:var(--text-muted); font-family:var(--font-display); letter-spacing:0.1em; text-transform:uppercase; display:block; margin-bottom:4px;">Phone Number</label>
          <input type="tel" id="em-phone" placeholder="+91 00000 00000" value="${settings.emergencyPhone || ''}" 
            style="width:100%; background:var(--bg-glass); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:10px 14px; color:var(--text-primary); font-size:var(--font-sm);"
            oninput="saveEmergencyContact()">
        </div>
        ${settings.emergencyPhone ? `
          <a href="tel:${settings.emergencyPhone}" class="btn btn-sm btn-danger" style="text-decoration:none; margin-top:var(--space-md); width:fit-content;">
            📞 Test Call to ${settings.emergencyName || 'Contact'}
          </a>
        ` : ''}
      </div>
    </div>

    <!-- === PWA Install === -->
    <div class="settings-group" id="pwa-group" style="display:none;">
      <div class="settings-group-title">App Installation</div>
      <div class="settings-item" onclick="installPWA()" style="cursor:pointer;">
        <div class="settings-item-left">
          <span class="settings-item-icon">📲</span>
          <div>
            <div class="settings-item-label">Install as App</div>
            <div class="settings-item-desc">Works offline, faster launch</div>
          </div>
        </div>
        <span style="color:var(--accent-primary)">→</span>
      </div>
    </div>

    <!-- === Data === -->
    <div class="settings-group">
      <div class="settings-group-title">Data</div>
      <div class="settings-item" style="cursor:pointer;" onclick="confirmClearHistory()">
        <div class="settings-item-left">
          <span class="settings-item-icon">🗑️</span>
          <div>
            <div class="settings-item-label">Clear Triage History</div>
            <div class="settings-item-desc">${historyCount} assessment${historyCount !== 1 ? 's' : ''} saved locally</div>
          </div>
        </div>
        <span style="color:var(--color-emergency);">→</span>
      </div>
    </div>

    <!-- === Stats === -->
    <div class="settings-group">
      <div class="settings-group-title">Your Activity</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-sm);">
        ${[
      ['Total Triages', stats.totalTriages || 0, 'var(--accent-primary)'],
      ['Days Active', stats.daysActive || 0, 'var(--accent-teal)'],
      ['Emergency Alerts', stats.emergencyCount || 0, 'var(--color-emergency)'],
      ['First Aid Views', stats.firstAidViewed || 0, 'var(--color-gold)'],
    ].map(([label, val, color]) => `
          <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:var(--space-md); text-align:center;">
            <div style="font-family:var(--font-display); font-size:1.5rem; font-weight:700; color:${color}">${val}</div>
            <div style="font-family:var(--font-display); font-size:9px; letter-spacing:0.08em; color:var(--text-muted); text-transform:uppercase; margin-top:2px;">${label}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- === Badge Gallery === -->
    <div class="settings-group">
      <div class="settings-group-title">Badges — ${unlockedBadges.length}/${allBadges.length} Unlocked</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-sm);">
        ${allBadges.map(badge => {
      const isUnlocked = unlockedBadges.includes(badge.id);
      return `
            <div style="
              background:var(--bg-card);
              border:1px solid ${isUnlocked ? 'var(--color-gold)' : 'var(--border-subtle)'};
              border-radius:var(--radius-md);
              padding:var(--space-md);
              opacity:${isUnlocked ? '1' : '0.45'};
              display:flex;
              flex-direction:column;
              align-items:center;
              text-align:center;
              gap:4px;
            ">
              <div style="font-size:28px;">${badge.icon}</div>
              <div style="font-family:var(--font-display); font-size:var(--font-xs); font-weight:700; letter-spacing:0.05em; color:${isUnlocked ? 'var(--color-gold)' : 'var(--text-muted)'};">${badge.name}</div>
              <div style="font-size:10px; color:var(--text-muted); line-height:1.3;">${badge.desc}</div>
              ${isUnlocked ? '<div style="font-size:9px; color:var(--color-gold); font-family:var(--font-display); letter-spacing:0.1em;">✓ UNLOCKED</div>' : ''}
            </div>
          `;
    }).join('')}
      </div>
    </div>

    <!-- === About === -->
    <div class="settings-group">
      <div class="settings-group-title">About</div>
      <div class="settings-item">
        <div class="settings-item-left">
          <span class="settings-item-icon">ℹ️</span>
          <div>
            <div class="settings-item-label">About UPLINE</div>
            <div class="settings-item-desc">Privacy-first offline emergency triage</div>
          </div>
        </div>
      </div>
      <div class="settings-item">
        <div class="settings-item-left">
          <span class="settings-item-icon">📋</span>
          <div>
            <div class="settings-item-label">Data Sources</div>
            <div class="settings-item-desc">WHO, Indian Red Cross, AIIMS, NHS guidelines</div>
          </div>
        </div>
      </div>
      <div class="settings-item">
        <div class="settings-item-left">
          <span class="settings-item-icon">🔒</span>
          <div>
            <div class="settings-item-label">Privacy</div>
            <div class="settings-item-desc">No data leaves your device. Ever.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="disclaimer-banner" style="margin-top:var(--space-lg);">
      ⚠ <strong>Medical Disclaimer:</strong> UPLINE does NOT provide medical diagnosis. It offers first-aid guidance based on verified emergency protocols. Always consult a qualified doctor. No personal data leaves your device.
    </div>

    <div class="settings-version">
      UPLINE v1.0.0 — Built for India 🇮🇳<br>
      © 2026 UPLINE. All rights reserved.
    </div>
  `;

  // Show PWA install if available
  requestAnimationFrame(() => {
    if (window.deferredInstallPrompt) {
      const pwaGroup = document.getElementById('pwa-group');
      if (pwaGroup) pwaGroup.style.display = 'block';
    }
  });

  return page;
}

function toggleTheme(isDark) {
  const theme = isDark ? 'dark' : 'light';
  Storage.setTheme(theme);
  showToast(isDark ? '🌙 Dark mode enabled' : '☀️ Light mode enabled');
}

function setSettingsLang(lang) {
  Storage.setLanguage(lang);
  Router.navigate('/settings');
  const names = { 'en-IN': 'English', 'hi-IN': 'हिन्दी', 'ta-IN': 'Tamil', 'te-IN': 'Telugu', 'bn-IN': 'Bengali' };
  showToast(`Language set to ${names[lang] || lang}`);
}

function saveEmergencyContact() {
  const name = document.getElementById('em-name')?.value || '';
  const phone = document.getElementById('em-phone')?.value || '';
  Storage.saveSetting('emergencyName', name);
  Storage.saveSetting('emergencyPhone', phone);
}

function confirmClearHistory() {
  if (confirm('Clear all triage history? This cannot be undone.')) {
    Storage.clearHistory();
    showToast('🗑 History cleared');
    Router.navigate('/settings');
  }
}
