/* ===== Results Page ===== */
function renderResults() {
  const page = document.createElement('div');
  page.className = 'page results-page page-scroll';

  const result = window._lastTriageResult;
  const symptoms = window._lastSymptoms || [];
  const inputText = window._lastInputText || '';

  if (!result) {
    page.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <div class="empty-state-text">No assessment data.<br>Start a voice triage first.</div>
        <button class="btn btn-primary" style="margin-top:var(--space-lg);" onclick="Router.navigate('/voice')">🎤 Start Triage</button>
      </div>
    `;
    return page;
  }

  const urgInfo = TriageEngine.getUrgencyInfo(result.urgency);
  const isEmergency = result.urgency === 'EMERGENCY';
  const isUrgent = result.urgency === 'URGENT';

  const symptomsHTML = symptoms.length > 0
    ? symptoms.map(s => {
      const pct = s.confidence ? Math.round(s.confidence * 100) : null;
      const confColor = pct >= 80 ? 'var(--accent-teal)' : pct >= 50 ? 'var(--color-gold)' : 'var(--text-muted)';
      return `<span class="symptom-chip">◈ ${s.name}${pct ? `<span style="font-size:9px; color:${confColor}; margin-left:4px;">${pct}%</span>` : ''}</span>`;
    }).join('')
    : '<span class="symptom-chip">No specific symptoms detected</span>';

  const actionsHTML = result.actions
    .map((action, i) => `
      <div class="action-item">
        <div class="action-number">${i + 1}</div>
        <div class="action-text">${action}</div>
      </div>
    `).join('');

  const firstAidHTML = result.firstAid ? `
    <div class="results-section">
      <h3>📋 First Aid: ${result.firstAid.title}</h3>
      <div class="firstaid-steps">
        ${result.firstAid.steps.map(step => `<div class="firstaid-step">${step}</div>`).join('')}
      </div>
      ${result.firstAid.warnings ? result.firstAid.warnings.map(w => `
        <div class="firstaid-warning">⚠ ${w}</div>
      `).join('') : ''}
      ${result.firstAid.whenToCallDoctor ? `
        <div style="margin-top:var(--space-md);padding:var(--space-md);background:var(--bg-glass);border-radius:var(--radius-md);font-size:var(--font-sm);color:var(--text-secondary);">
          🩺 <strong>When to call doctor:</strong> ${result.firstAid.whenToCallDoctor}
        </div>
      ` : ''}
    </div>
  ` : '';

  // Build share text
  const shareText = `UPLINE Triage Result\n\nUrgency: ${urgInfo.label}\nSymptoms: ${symptoms.map(s => s.name).join(', ') || inputText}\n\nActions:\n${result.actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\n⚠ This is NOT a medical diagnosis. Always consult a doctor.`;

  page.innerHTML = `
    <button class="btn btn-ghost" onclick="Router.navigate('/dashboard')" style="margin-bottom:var(--space-lg);">
      ← Back
    </button>

    <div class="results-urgency-card ${urgInfo.color}">
      <div class="results-urgency-icon">${urgInfo.icon}</div>
      <div class="results-urgency-level" style="color:var(--color-${urgInfo.color === 'low' ? 'low' : urgInfo.color})">${urgInfo.label}</div>
      <div class="results-urgency-desc">${urgInfo.message}</div>
    </div>

    ${isEmergency ? `
      <a href="tel:108" class="btn btn-danger btn-block btn-lg results-call-btn" id="call-108-btn" style="text-decoration:none; margin-bottom:var(--space-md);" onclick="if(navigator.vibrate) navigator.vibrate([200,100,200])">
        📞 Call 108 — Ambulance NOW
      </a>
      <a href="tel:112" class="btn btn-ghost btn-block" style="text-decoration:none; margin-bottom:var(--space-xl); font-family:var(--font-display); letter-spacing:0.05em;">
        📞 Call 112 — National Emergency
      </a>
    ` : isUrgent ? `
      <a href="tel:108" class="btn btn-danger btn-block" style="text-decoration:none; margin-bottom:var(--space-xl);" onclick="if(navigator.vibrate) navigator.vibrate(100)">
        📞 Call 108 if Worsening
      </a>
    ` : ''}

    <div class="results-section">
      <h3>Detected Symptoms</h3>
      <div style="padding:var(--space-sm) 0;">
        ${symptomsHTML}
      </div>
      ${inputText ? `<p style="font-size:var(--font-xs);color:var(--text-muted);margin-top:var(--space-sm);font-style:italic;">"${inputText}"</p>` : ''}
    </div>

    <div class="results-section">
      <h3>✅ Recommended Actions</h3>
      ${actionsHTML}
    </div>

    ${firstAidHTML}

    <div class="disclaimer-banner" style="margin-top:var(--space-lg);">
      ⚠ This is NOT a medical diagnosis. UPLINE provides first-aid guidance only. Always consult a qualified medical professional.
    </div>

    <!-- Share & Action Row -->
    <div style="display:flex; flex-direction:column; gap:var(--space-md); margin-top:var(--space-xl);">
      ${navigator.share ? `
        <button class="btn btn-ghost btn-block" onclick="shareResult('${encodeURIComponent(shareText)}')" id="share-btn">
          ↑ Share Assessment
        </button>
      ` : ''}
      <div style="display:flex; gap:var(--space-md);">
        <button class="btn btn-ghost btn-block" onclick="Router.navigate('/emergency')">🚑 Emergency Contacts</button>
        <button class="btn btn-primary btn-block" onclick="Router.navigate('/voice')">🎤 New Assessment</button>
      </div>
    </div>
  `;

  // Show full-screen EMERGENCY overlay for critical cases
  if (isEmergency) {
    requestAnimationFrame(() => _showEmergencyOverlay());
  }

  return page;
}

/* ===== Emergency Full-Screen Overlay ===== */
function _showEmergencyOverlay() {
  // Haptic burst
  if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 600]);

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'emergency-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 99999;
    background: #0a0000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    animation: emergencyPulse 1s ease-in-out infinite alternate;
    padding: 24px;
    text-align: center;
  `;

  overlay.innerHTML = `
    <style>
      @keyframes emergencyPulse {
        from { background: #0a0000; }
        to   { background: #200000; }
      }
      @keyframes sosIconBounce {
        0%,100% { transform: scale(1); }
        50%      { transform: scale(1.15); }
      }
    </style>

    <div style="font-size:72px; animation: sosIconBounce 1s ease-in-out infinite;">🚨</div>

    <div style="
      font-family: var(--font-display, monospace);
      font-size: clamp(28px, 7vw, 40px);
      font-weight: 900;
      letter-spacing: 0.15em;
      color: #ff4444;
      text-transform: uppercase;
    ">EMERGENCY</div>

    <div style="
      font-size: 14px;
      color: rgba(255,255,255,0.75);
      max-width: 280px;
      line-height: 1.6;
    ">Immediate medical help is required. Call 108 now for National Emergency Ambulance.</div>

    <a href="tel:108"
       id="overlay-call-108"
       onclick="if(navigator.vibrate) navigator.vibrate([200,100,400]);"
       style="
         display: flex; align-items: center; gap: 12px;
         background: #ef4444;
         color: white;
         text-decoration: none;
         padding: 18px 36px;
         border-radius: 100px;
         font-family: var(--font-display, monospace);
         font-size: 20px;
         font-weight: 800;
         letter-spacing: 0.1em;
         box-shadow: 0 0 40px rgba(239,68,68,0.7);
         width: 100%;
         justify-content: center;
         max-width: 320px;
       ">
      📞 CALL 108 — NOW
    </a>

    <a href="tel:112"
       style="
         color: rgba(255,150,150,0.8);
         text-decoration: none;
         font-size: 14px;
         font-family: var(--font-display, monospace);
         letter-spacing: 0.08em;
       ">
      or dial 112 — Universal Emergency
    </a>

    <button
      id="overlay-dismiss"
      onclick="document.getElementById('emergency-overlay').remove();"
      style="
        background: transparent;
        border: 1px solid rgba(255,255,255,0.2);
        color: rgba(255,255,255,0.5);
        padding: 10px 24px;
        border-radius: 100px;
        font-size: 12px;
        font-family: var(--font-display, monospace);
        letter-spacing: 0.1em;
        cursor: pointer;
        margin-top: 12px;
      ">
      VIEW FULL REPORT ▶
    </button>
  `;

  document.body.appendChild(overlay);
}

function shareResult(encodedText) {
  const text = decodeURIComponent(encodedText);
  if (navigator.share) {
    navigator.share({
      title: 'UPLINE Triage Result',
      text: text
    }).catch(() => { });
  }
}
