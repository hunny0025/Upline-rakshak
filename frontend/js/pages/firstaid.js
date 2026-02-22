/* ===== First Aid Page ===== */
let allFirstAidData = null;
let currentFirstAidSearch = '';
let currentDisasterMode = 'general';
let currentPlayingId = null;

async function loadFirstAidData() {
  if (!allFirstAidData) {
    const res = await fetch('./data/firstaid.json');
    const data = await res.json();
    allFirstAidData = data.instructions;
  }
  return allFirstAidData;
}

function renderFirstAid() {
  const page = document.createElement('div');
  page.className = 'page firstaid-page page-scroll';

  page.innerHTML = `
    <h2>🩹 First Aid Guide</h2>
    <p style="margin-bottom: var(--space-lg); font-size: var(--font-sm);">Verified emergency instructions based on WHO & Red Cross guidelines.</p>
    
    <div class="firstaid-search">
      <div class="search-wrapper">
        <input type="text" class="search-input" id="firstaid-search-input" placeholder="Search first aid topics..." oninput="filterFirstAid(this.value)">
      </div>
    </div>

    <div class="disaster-toggle" id="disaster-toggle">
      <button class="disaster-chip active" data-mode="general" onclick="setDisasterMode('general')">GENERAL</button>
      <button class="disaster-chip" data-mode="flood" onclick="setDisasterMode('flood')">🌊 FLOOD</button>
      <button class="disaster-chip" data-mode="earthquake" onclick="setDisasterMode('earthquake')">🏚️ EARTHQUAKE</button>
    </div>

    <div class="firstaid-list" id="firstaid-list">
      <div class="empty-state">
        <div class="empty-state-icon">⏳</div>
        <div class="empty-state-text">Loading...</div>
      </div>
    </div>
  `;

  // Load data async
  setTimeout(async () => {
    const data = await loadFirstAidData();
    if (data) renderFirstAidList(data);
  }, 50);

  return page;
}

function renderFirstAidList(data) {
  const container = document.getElementById('firstaid-list');
  if (!container) return;

  let entries = Object.entries(data);

  // 1. Filter by search query
  if (currentFirstAidSearch) {
    const q = currentFirstAidSearch.toLowerCase();
    entries = entries.filter(([key, val]) =>
      val.title.toLowerCase().includes(q) ||
      key.toLowerCase().includes(q)
    );
  }

  // 2. Filter / Sort by Disaster Mode Relevance
  const priorities = {
    flood: ['drowning', 'hypothermia', 'electric_shock', 'snake_bite', 'severe_bleeding', 'fracture'],
    earthquake: ['fracture', 'head_injury', 'severe_bleeding', 'spinal_injury', 'unconsciousness', 'burns', 'cardiac_emergency'],
    general: []
  };

  const priorityList = priorities[currentDisasterMode] || [];

  if (priorityList.length > 0) {
    entries.sort((a, b) => {
      const idxA = priorityList.indexOf(a[0]);
      const idxB = priorityList.indexOf(b[0]);

      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a[1].title.localeCompare(b[1].title);
    });
  } else {
    // Alphabetical fallback for general mode
    entries.sort((a, b) => a[1].title.localeCompare(b[1].title));
  }

  if (entries.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-text">No results found for "${currentFirstAidSearch}"</div>
      </div>
    `;
    return;
  }

  container.innerHTML = entries.map(([key, item]) => {
    const isPriority = priorityList.includes(key);
    const isPlaying = currentPlayingId === key;
    return `
    <div class="accordion-item" id="fa-${key}">
      <button class="accordion-header" onclick="toggleAccordion('fa-${key}')">
        <span class="accordion-icon">${item.icon}</span>
        <span>${item.title}</span>
        ${isPriority ? '<span style="margin-left:auto; font-size:10px; color:var(--color-urgent); border:1px solid var(--color-urgent); padding:2px 6px; border-radius:10px; font-weight:bold; letter-spacing:0.05em;">PRIORITY</span>' : ''}
        <span class="accordion-arrow" style="${isPriority ? 'margin-left:8px;' : ''}">▼</span>
      </button>
      <div class="accordion-body">
        <div class="accordion-content">
          <button class="btn btn-primary tts-btn" onclick="playFirstAidTTS('${key}')" style="margin-bottom: var(--space-md); width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); color: var(--accent-primary);">
            <span>${isPlaying ? '⏹️ Stop Reading' : '🔊 Read Aloud'}</span>
          </button>
          
          <div class="firstaid-steps">
            ${item.steps.map(step => `<div class="firstaid-step">${step}</div>`).join('')}
          </div>
          ${item.warnings ? item.warnings.map(w => `
            <div class="firstaid-warning">⚠️ ${w}</div>
          `).join('') : ''}
          ${item.whenToCallDoctor ? `
            <div style="margin-top: var(--space-md); padding: var(--space-md); background: var(--bg-glass); border-radius: var(--radius-md); font-size: var(--font-xs); color: var(--text-secondary);">
              🩺 ${item.whenToCallDoctor}
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `}).join('');
}

function filterFirstAid(value) {
  currentFirstAidSearch = value;
  if (allFirstAidData) {
    renderFirstAidList(allFirstAidData);
  }
}

function setDisasterMode(mode) {
  currentDisasterMode = mode;

  document.querySelectorAll('.disaster-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.mode === mode);
  });

  if (allFirstAidData) {
    renderFirstAidList(allFirstAidData);
  }
}

function playFirstAidTTS(key) {
  if (!allFirstAidData || !allFirstAidData[key]) return;

  if (currentPlayingId === key) {
    // Stop playing
    TTS.stop();
    currentPlayingId = null;
    renderFirstAidList(allFirstAidData); // re-render to update button text
    return;
  }

  // Stop any existing TTS safely
  TTS.stop();
  currentPlayingId = key;
  renderFirstAidList(allFirstAidData); // re-render to update showing 'Stop Reading'

  const item = allFirstAidData[key];

  // Construct readable string
  let textToRead = `${item.title}. `;
  textToRead += "Steps to follow: ";
  item.steps.forEach((step, i) => {
    textToRead += `Step ${i + 1}: ${step}. `;
  });

  if (item.warnings && item.warnings.length > 0) {
    textToRead += "Warnings: ";
    item.warnings.forEach(w => {
      textToRead += `${w}. `;
    });
  }

  if (item.whenToCallDoctor) {
    textToRead += `When to call a doctor: ${item.whenToCallDoctor}`;
  }

  TTS.speak(textToRead, () => {
    // Callback when finished
    currentPlayingId = null;
    if (allFirstAidData) renderFirstAidList(allFirstAidData);
  });
}

function toggleAccordion(id) {
  const item = document.getElementById(id);
  if (item) {
    const wasOpen = item.classList.contains('open');
    item.classList.toggle('open');
    // Track first aid views for gamification
    if (!wasOpen) {
      Storage.incrementStat('firstAidViewed');
    }
  }
}

