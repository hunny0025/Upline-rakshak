/* ===== Splash Page — HUD Boot Screen ===== */
function renderSplash() {
  const el = document.createElement('div');
  el.className = 'splash-page';
  el.id = 'splash';

  el.innerHTML = `
        <div class="splash-logo">
            <div class="splash-logo-hex">
                <span class="splash-logo-inner">⚡</span>
            </div>
        </div>
        <div class="splash-title">UPLINE</div>
        <div class="splash-tagline">Offline Triage System — Tactical Mode</div>
        <div class="splash-loading">
            <div class="splash-bar-track">
                <div class="splash-bar-fill" id="splash-bar"></div>
            </div>
        </div>
    `;

  return el;
}

function hideSplash() {
  const splash = document.getElementById('splash');
  if (splash) {
    splash.classList.add('hide');
    setTimeout(() => splash.remove(), 700);
  }
}
