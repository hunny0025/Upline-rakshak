/* ===== START Triage Chatbot Page ===== */
const StartTriageQuestions = [
    { id: 1, text: "Can the person walk without help?", choices: ["Yes", "No"], yesNext: -1, noNext: 2 },
    { id: 2, text: "Is the person breathing?", choices: ["Yes", "No"], yesNext: 3, noNext: -2 },
    { id: 3, text: "Is breathing very fast or laboured (>30 breaths/min)?", choices: ["Yes — fast/laboured", "No — normal"], yesNext: -3, noNext: 4, critical: true },
    { id: 4, text: "Is there a radial (wrist) pulse present?", choices: ["Yes", "No"], yesNext: 5, noNext: -3 },
    { id: 5, text: "Does skin color return within 2 seconds when fingernail is pressed?", choices: ["Yes — <2s", "No — >2s (poor perfusion)"], yesNext: 6, noNext: -3 },
    { id: 6, text: "Can the person follow simple commands? (e.g. 'Open your eyes')", choices: ["Yes", "No"], yesNext: 7, noNext: -3 },
    { id: 7, text: "Is severe pain present (chest, abdomen, head)?", choices: ["Yes", "No"], yesNext: 8, noNext: 9 },
    { id: 8, text: "Is there chest pain AND difficulty breathing?", choices: ["Yes", "No"], yesNext: -3, noNext: 10, critical: true },
    { id: 9, text: "Is there uncontrolled bleeding?", choices: ["Yes", "No"], yesNext: -3, noNext: 10, critical: true },
    { id: 10, text: "Is there a suspected head or spinal injury?", choices: ["Yes", "No"], yesNext: 11, noNext: 12 },
    { id: 11, text: "Was there any loss of consciousness, even briefly?", choices: ["Yes", "No"], yesNext: -3, noNext: -4 },
    { id: 12, text: "Are there >10% body burns or crush injuries?", choices: ["Yes", "No"], yesNext: -4, noNext: -5 },
    { id: 13, text: "Are there multiple simultaneous symptoms?", choices: ["Yes", "No"], yesNext: -4, noNext: -5 }
];

function getStartResult(code) {
    switch (code) {
        case -1: return { category: "GREEN", title: "Minor — Walking Wounded", color: "var(--accent-teal)", desc: "Patient can walk. Lower priority. Treat when resources allow." };
        case -2: return { category: "BLACK", title: "Expectant — Not Breathing", color: "#666666", desc: "No respirations even after airway repositioning. Remove from treatment priority in mass casualty." };
        case -3: return { category: "RED", title: "Immediate — Life Threatening", color: "var(--color-emergency)", desc: "Critical signs detected. Patient needs immediate intervention." };
        case -4: return { category: "YELLOW", title: "Delayed — Serious but Stable", color: "var(--color-gold)", desc: "Serious condition but can wait for treatment after RED patients." };
        default: return { category: "GREEN", title: "Minor — Low Priority", color: "var(--accent-teal)", desc: "No life-threatening signs detected. Patient can wait for treatment." };
    }
}

let startChatHistory = [];
let startCurrentQId = 1;

function renderTriageChat() {
    startChatHistory = [];
    startCurrentQId = 1;

    const page = document.createElement('div');
    page.className = 'page triage-chat-page page-scroll';
    page.style.display = 'flex';
    page.style.flexDirection = 'column';
    page.style.height = '100dvh';

    page.innerHTML = `
        <div class="chat-header">
            <h2>START Triage Chatbot</h2>
            <p>13-step protocol (RED / YELLOW / GREEN / BLACK)</p>
        </div>
        
        <!-- Progress Bar -->
        <div class="chat-progress">
            <div class="chat-progress-fill" id="chat-progress-fill" style="width: 0%"></div>
        </div>

        <div class="chat-scroll-area" id="chat-messages" style="flex:1; overflow-y:auto; padding:var(--space-md); padding-bottom:80px; display:flex; flex-direction:column; gap:var(--space-md);">
        </div>

        <div class="chat-input-area" id="chat-inputs" style="padding:10px 16px; position:fixed; bottom:var(--nav-height); left:0; width:100%; z-index:10; pointer-events:none;">
        </div>
    `;

    setTimeout(() => pushQuestion(1), 50);

    return page;
}

function pushQuestion(qId) {
    const q = StartTriageQuestions.find(x => x.id === qId);
    if (!q) return;

    startCurrentQId = qId;

    // Update progress
    const pct = Math.round(((qId - 1) / 13) * 100);
    const fill = document.getElementById('chat-progress-fill');
    if (fill) fill.style.width = pct + '%';

    const msgs = document.getElementById('chat-messages');

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble bot-bubble';
    bubble.innerHTML = `
        <div class="chat-q-number">Question ${q.id}/13</div>
        <div class="chat-q-text">${q.text}</div>
        ${q.critical ? '<div class="chat-q-warn">⚠ Critical Indicator</div>' : ''}
    `;
    msgs.appendChild(bubble);

    _scrollToBottom(msgs);
    renderInputs(q);
}

function renderInputs(q) {
    const container = document.getElementById('chat-inputs');
    if (!container) return;

    // Both buttons trigger submitAnswer
    container.innerHTML = `
        <div style="display:flex; gap:10px; max-width:600px; margin:0 auto; pointer-events:auto;">
            <button class="btn" style="flex:1; background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.25); color:#ffffff; font-weight:600; padding:10px 8px; border-radius:8px; font-size:14px; box-shadow:0 6px 16px rgba(0,0,0,0.4); backdrop-filter: blur(10px);" onclick="submitAnswer(true)">
                ${q.choices[0]}
            </button>
            <button class="btn" style="flex:1; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.15); color:#ffffff; font-weight:600; padding:10px 8px; border-radius:8px; font-size:14px; box-shadow:0 6px 16px rgba(0,0,0,0.4); backdrop-filter: blur(10px);" onclick="submitAnswer(false)">
                ${q.choices[1]}
            </button>
        </div>
    `;
}

function submitAnswer(isYes) {
    const q = StartTriageQuestions.find(x => x.id === startCurrentQId);
    if (!q) return;

    const answerText = isYes ? q.choices[0] : q.choices[1];
    const nextCode = isYes ? q.yesNext : q.noNext;

    // Clear inputs immediately
    document.getElementById('chat-inputs').innerHTML = '';

    const msgs = document.getElementById('chat-messages');

    // Render user bubble
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble user-bubble';
    userBubble.innerHTML = answerText;
    msgs.appendChild(userBubble);

    _scrollToBottom(msgs);

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(50);

    setTimeout(() => {
        if (nextCode < 0) {
            pushResult(nextCode);
        } else {
            pushQuestion(nextCode);
        }
    }, 400);
}

function pushResult(code) {
    const res = getStartResult(code);

    // Fill to 100%
    const fill = document.getElementById('chat-progress-fill');
    if (fill) fill.style.width = '100%';

    const msgs = document.getElementById('chat-messages');

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble bot-bubble result-bubble';
    bubble.style.borderColor = res.color;
    bubble.innerHTML = `
        <div class="result-tag" style="background:${res.color}">${res.category}</div>
        <h3 style="margin-top:12px; font-family:var(--font-display); letter-spacing:0.05em; color:${res.color};">${res.title}</h3>
        <p style="color:var(--text-muted); font-size:14px; margin-top:8px;">${res.desc}</p>
        
        <div style="margin-top:24px; display:flex; flex-direction:column; gap:12px;">
            ${res.category === 'RED' || res.category === 'YELLOW' ? `
                <button class="btn" style="background:var(--color-emergency); width:100%; border:none; color:#fff;" onclick="window.location.href='tel:108'">
                    🚨 Call 108 Ambulance
                </button>
            ` : ''}
            <button class="btn btn-primary" style="width:100%; background:var(--bg-card); border:1px solid var(--border-light);" onclick="renderTriageChat()">
                🔄 Restart Assessment
            </button>
        </div>
    `;
    msgs.appendChild(bubble);
    _scrollToBottom(msgs);

    // Award badge points for completing triage
    Storage.incrementStat('totalTriages');
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}

function _scrollToBottom(el) {
    setTimeout(() => {
        el.scrollTop = el.scrollHeight;
    }, 50);
}
