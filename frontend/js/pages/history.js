/* ===== Medical History Page ===== */
function renderHistory() {
    const page = document.createElement('div');
    page.className = 'page history-page page-scroll';

    page.innerHTML = `
    <div style="display:flex; align-items:center; gap:12px; margin-bottom:var(--space-lg);">
      <button class="btn btn-ghost" onclick="Router.navigate('/dashboard')" id="history-back-btn" style="padding:8px 12px;">← Back</button>
      <h2 style="margin:0; flex:1;">📋 Medical History</h2>
      <button class="btn btn-ghost" onclick="_clearAllHistory()" id="history-clear-btn" style="font-size:11px; padding:8px 12px; color:var(--color-emergency);">Clear All</button>
    </div>

    <div id="history-content" style="display:flex; flex-direction:column; gap:12px;">
      <div class="empty-state">
        <div class="empty-state-icon">⏳</div>
        <div class="empty-state-text">Loading history…</div>
      </div>
    </div>

    <div style="margin-top:var(--space-xl); padding:var(--space-md); background:var(--bg-card); border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
      <div style="font-family:var(--font-display); font-size:9px; letter-spacing:0.12em; color:var(--text-muted); text-transform:uppercase; margin-bottom:var(--space-sm);">Storage Info</div>
      <div id="history-storage-info" style="font-size:11px; color:var(--text-secondary);">—</div>
    </div>
  `;

    // Load history async from IndexedDB → localStorage fallback
    setTimeout(async () => {
        await _loadAndRenderHistory();
    }, 50);

    return page;
}

async function _loadAndRenderHistory() {
    const container = document.getElementById('history-content');
    const storageInfo = document.getElementById('history-storage-info');
    if (!container) return;

    // Try IndexedDB first, fallback to localStorage
    let entries = [];
    let source = 'localStorage';

    if (typeof DB !== 'undefined') {
        try {
            entries = await DB.getHistory(50);
            if (entries.length > 0) source = 'IndexedDB';
        } catch (e) {
            /* fall through */
        }
    }

    // Fallback to localStorage
    if (entries.length === 0) {
        entries = Storage.getHistory();
    }

    if (storageInfo) {
        storageInfo.textContent = `${entries.length} record${entries.length !== 1 ? 's' : ''} • Source: ${source}`;
    }

    if (entries.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-text">No triage history yet.<br>Complete a voice assessment to build your history.</div>
        <button class="btn btn-primary" style="margin-top:var(--space-lg);" onclick="Router.navigate('/voice')" id="history-start-btn">🎤 Start Triage</button>
      </div>
    `;
        return;
    }

    const urgencyColors = {
        EMERGENCY: { line: 'var(--color-emergency)', bg: 'rgba(239,68,68,0.08)', badge: '#ef4444' },
        URGENT: { line: 'var(--color-urgent)', bg: 'rgba(245,158,11,0.08)', badge: '#f59e0b' },
        MODERATE: { line: 'var(--color-moderate)', bg: 'rgba(251,191,36,0.08)', badge: '#fbbf24' },
        LOW: { line: 'var(--accent-teal)', bg: 'rgba(20,184,166,0.08)', badge: '#14b8a6' },
    };

    container.innerHTML = entries.map((entry, idx) => {
        const urgInfo = TriageEngine.getUrgencyInfo(entry.urgency);
        const colors = urgencyColors[entry.urgency] || urgencyColors.LOW;
        const date = entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'Unknown time';
        const detectedNames = (entry.detectedSymptoms || []).map(s => s.name).join(', ') || '—';

        return `
      <div class="history-detail-card"
           id="history-card-${idx}"
           style="
             background: ${colors.bg};
             border: 1px solid ${colors.line}44;
             border-left: 3px solid ${colors.line};
             border-radius: var(--radius-md);
             padding: var(--space-md) var(--space-lg);
             cursor: pointer;
           "
           onclick="_viewHistoryEntryFromHistory(${idx})">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
          <div style="font-family:var(--font-display); font-size:9px; letter-spacing:0.1em; color:var(--text-muted);">${date}</div>
          <span style="
            background:${colors.badge};
            color:white;
            font-family:var(--font-display);
            font-size:9px;
            letter-spacing:0.08em;
            padding:2px 8px;
            border-radius:100px;
            font-weight:700;
          ">${urgInfo.icon} ${urgInfo.label}</span>
        </div>
        <div style="font-size:13px; font-weight:600; color:var(--text-primary); margin-bottom:4px;">
          ${entry.symptoms || 'No symptom text recorded'}
        </div>
        <div style="font-size:11px; color:var(--text-muted);">
          Detected: ${detectedNames}
        </div>
      </div>
    `;
    }).join('');

    // Save entries reference for detail view
    window._historyEntries = entries;
}

function _viewHistoryEntryFromHistory(idx) {
    const entries = window._historyEntries || [];
    const item = entries[idx];
    if (item && item.resultData) {
        window._lastTriageResult = item.resultData;
        window._lastSymptoms = item.detectedSymptoms || [];
        window._lastInputText = item.symptoms || '';
        Router.navigate('/results');
    } else {
        showToast('No result data for this entry.');
    }
}

async function _clearAllHistory() {
    if (!confirm('Clear all triage history? This cannot be undone.')) return;
    Storage.clearHistory();
    if (typeof DB !== 'undefined') await DB.clearHistory();
    await _loadAndRenderHistory();
    showToast('✅ History cleared');
}
