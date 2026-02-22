/* ===== UPLINE — Advanced Triage Chatbot ===== */

/* ──────────────────────────────────────────────────────────
   PHASE 1 — Symptom Intake Questions (pre-START)
   ────────────────────────────────────────────────────────── */
const INTAKE_STEPS = [
    {
        id: 'patient_type',
        text: "Who needs help right now?",
        type: 'chips',
        chips: ['Myself', 'Someone else', 'A child (<12)', 'An elderly person'],
    },
    {
        id: 'chief_complaint',
        text: "What's the main problem? Describe in a few words or pick a category:",
        type: 'chips_plus_text',
        chips: ['Chest pain', 'Breathing difficulty', 'Severe bleeding', 'Unconscious / fainting', 'Head injury', 'Broken bone', 'Burn', 'Allergic reaction', 'Stroke symptoms', 'Other'],
        placeholder: 'Type symptoms here…'
    },
    {
        id: 'pain_scale',
        text: "Rate the pain level right now (0 = none, 10 = worst imaginable):",
        type: 'slider',
        min: 0, max: 10, default: 5,
        labels: ['No pain', 'Moderate', 'Unbearable']
    },
    {
        id: 'duration',
        text: "How long has this been going on?",
        type: 'chips',
        chips: ['Just started (<5 min)', '5–30 minutes', '30 min – 2 hours', 'More than 2 hours', 'Ongoing / chronic']
    },
    {
        id: 'consciousness',
        text: "Is the person conscious and responsive?",
        type: 'chips',
        chips: ['Yes — fully alert', 'Confused / drowsy', 'Responds to voice only', 'No response at all']
    }
];

/* ──────────────────────────────────────────────────────────
   PHASE 2 — START Triage Protocol Questions
   ────────────────────────────────────────────────────────── */
const START_QUESTIONS = [
    { id: 1, text: "Can the person walk without help?", choices: ["✅ Yes — walking", "❌ No — cannot walk"], yesNext: -1, noNext: 2, critical: false },
    { id: 2, text: "Is the person breathing?", choices: ["✅ Yes — breathing", "❌ No — not breathing"], yesNext: 3, noNext: -2, critical: true },
    { id: 3, text: "Is breathing very fast or laboured? (>30 breaths/min)", choices: ["⚠️ Yes — fast/laboured", "✅ No — normal rate"], yesNext: -3, noNext: 4, critical: true },
    { id: 4, text: "Is there a radial (wrist) pulse present?", choices: ["✅ Yes — pulse felt", "❌ No pulse detected"], yesNext: 5, noNext: -3, critical: true },
    { id: 5, text: "Does skin colour return within 2 seconds when the fingernail is pressed?", choices: ["✅ Yes — <2 seconds", "❌ No — >2s (poor perfusion)"], yesNext: 6, noNext: -3, critical: true },
    { id: 6, text: "Can the person follow simple commands? (e.g. 'Open your eyes')", choices: ["✅ Yes — follows commands", "❌ No — unresponsive"], yesNext: 7, noNext: -3, critical: false },
    { id: 7, text: "Is there severe pain in the chest, abdomen, or head?", choices: ["⚠️ Yes — severe pain", "✅ No — manageable"], yesNext: 8, noNext: 9, critical: false },
    { id: 8, text: "Is there chest pain AND difficulty breathing together?", choices: ["⚠️ Yes — both present", "✅ No — only one"], yesNext: -3, noNext: 10, critical: true },
    { id: 9, text: "Is there uncontrolled or heavy bleeding?", choices: ["⚠️ Yes — bleeding heavily", "✅ No — controlled"], yesNext: -3, noNext: 10, critical: true },
    { id: 10, text: "Is there a suspected head or spinal injury?", choices: ["⚠️ Yes — suspected", "✅ No — no injury"], yesNext: 11, noNext: 12, critical: false },
    { id: 11, text: "Was there any loss of consciousness, even briefly?", choices: ["⚠️ Yes — lost consciousness", "✅ No — stayed conscious"], yesNext: -3, noNext: -4, critical: true },
    { id: 12, text: "Are there burns covering >10% of body, or crush injuries?", choices: ["⚠️ Yes — serious injuries", "✅ No — minor"], yesNext: -4, noNext: -5, critical: false },
];

/* ──────────────────────────────────────────────────────────
   Result Definitions
   ────────────────────────────────────────────────────────── */
const START_RESULTS = {
    '-1': {
        category: 'GREEN',
        title: 'Minor — Walking Wounded',
        color: '#14b8a6',
        urgency: 'LOW',
        icon: '🟢',
        desc: 'Patient is ambulatory. Lower clinical priority. Treat after RED and YELLOW patients.',
        firstAid: [
            'Keep the person calm and seated in a safe area',
            'Reassess every 10–15 minutes for deterioration',
            'Apply basic wound care if needed',
            'Note any worsening of symptoms'
        ],
        doNot: ['Do not leave patient completely unattended'],
        callAmb: false
    },
    '-2': {
        category: 'BLACK',
        title: 'Expectant — No Breathing',
        color: '#6b7280',
        urgency: 'IMMEDIATE',
        icon: '⚫',
        desc: 'No respirations detected even after airway repositioning. In mass casualty: remove from active treatment priority.',
        firstAid: [
            'Reposition airway — tilt head, lift chin',
            'Check for foreign body obstruction — finger sweep',
            'Begin CPR if trained and resources allow',
            'Call 108 immediately'
        ],
        doNot: ['Do not delay care for others if in mass casualty scenario'],
        callAmb: true
    },
    '-3': {
        category: 'RED',
        title: 'Immediate — Life Threatening',
        color: '#ef4444',
        urgency: 'EMERGENCY',
        icon: '🔴',
        desc: 'Critical signs detected. Patient requires immediate medical intervention. Call 108 NOW.',
        firstAid: [
            'Call 108 immediately — do not delay',
            'Keep airway open — tilt head back gently',
            'Control severe bleeding with direct pressure',
            'Do NOT move if spinal injury suspected',
            'Keep patient warm and still',
            'Monitor breathing every 30 seconds'
        ],
        doNot: ['Do not give food or water', 'Do not remove embedded objects'],
        callAmb: true
    },
    '-4': {
        category: 'YELLOW',
        title: 'Delayed — Serious but Stable',
        color: '#f59e0b',
        urgency: 'URGENT',
        icon: '🟡',
        desc: 'Serious condition but currently stable. Prioritise after RED patients. Monitor closely.',
        firstAid: [
            'Keep patient still and calm',
            'Apply splinting for fractures if trained',
            'Cover wounds with clean dressings',
            'Reassess vitals every 5 minutes',
            'Prepare to escalate if condition worsens'
        ],
        doNot: ['Do not allow patient to eat or drink before medical assessment'],
        callAmb: true
    },
    '-5': {
        category: 'GREEN',
        title: 'Minor — Low Priority',
        color: '#14b8a6',
        urgency: 'LOW',
        icon: '🟢',
        desc: 'No immediately life-threatening signs. Patient can wait for assessment.',
        firstAid: [
            'Rest and monitor in a safe location',
            'Apply ice/cold pack for bruising (not directly on skin)',
            'Basic wound cleaning with clean water',
            'Visit a clinic or hospital at earliest convenience'
        ],
        doNot: ['Do not ignore worsening pain or new symptoms'],
        callAmb: false
    }
};

/* ──────────────────────────────────────────────────────────
   State
   ────────────────────────────────────────────────────────── */
let _chatPhase = 'intake';   // 'intake' | 'start' | 'result'
let _intakeStep = 0;
let _intakeData = {};
let _startQId = 1;
let _chatListening = false;
let _recognizer = null;

/* ──────────────────────────────────────────────────────────
   Page Render
   ────────────────────────────────────────────────────────── */
function renderTriageChat() {
    _chatPhase = 'intake';
    _intakeStep = 0;
    _intakeData = {};
    _startQId = 1;

    const page = document.createElement('div');
    page.className = 'page triage-chat-page page-scroll';
    page.id = 'triage-chat-page';
    page.style.cssText = 'display:flex; flex-direction:column; height:100dvh; overflow:hidden;';

    page.innerHTML = `
        <!-- Header -->
        <div style="
            padding: 14px 16px 10px;
            background: var(--bg-card);
            border-bottom: 1px solid var(--border-subtle);
            display: flex; align-items: center; gap: 12px;
            flex-shrink: 0;
        ">
            <button onclick="Router.navigate('/dashboard')" style="background:none;border:none;color:var(--text-muted);font-size:18px;cursor:pointer;padding:0;">←</button>
            <div style="flex:1;">
                <div style="font-family:var(--font-display); font-size:12px; font-weight:800; letter-spacing:0.12em; color:var(--accent-primary);">UPLINE TRIAGE AI</div>
                <div style="font-size:10px; color:var(--text-muted);">START Protocol · Offline · Multilingual</div>
            </div>
            <div id="chat-phase-badge" style="
                font-family:var(--font-display); font-size:9px; letter-spacing:0.1em;
                background: rgba(20,184,166,0.15); color: var(--accent-teal);
                padding: 3px 10px; border-radius: 100px; border: 1px solid rgba(20,184,166,0.3);
            ">INTAKE</div>
        </div>

        <!-- Progress Bar -->
        <div style="height:3px; background:rgba(255,255,255,0.08); flex-shrink:0;">
            <div id="chat-progress-fill" style="height:100%; width:0%; background:var(--accent-teal); transition:width 0.5s ease; border-radius:0 2px 2px 0;"></div>
        </div>

        <!-- Messages -->
        <div id="chat-messages" style="
            flex:1; overflow-y:auto; padding:16px; padding-bottom:140px;
            display:flex; flex-direction:column; gap:14px;
            scroll-behavior:smooth;
        "></div>

        <!-- Input Area -->
        <div id="chat-input-area" style="
            position:fixed; bottom:var(--nav-height,60px); left:0; width:100%;
            padding:12px 16px; background: rgba(12,12,20,0.95);
            backdrop-filter:blur(12px);
            border-top: 1px solid var(--border-subtle);
            z-index: 50;
        "></div>
    `;

    // Kick off after render
    setTimeout(() => {
        _botMessage("👋 Hello! I'm the UPLINE Triage AI. I'll guide you through a clinical START protocol assessment.\n\n⚡ This works completely offline. Answers are used only for triage guidance.", () => {
            setTimeout(() => _nextIntake(), 600);
        });
    }, 300);

    return page;
}

/* ──────────────────────────────────────────────────────────
   Bot Messaging  
   ────────────────────────────────────────────────────────── */
function _botMessage(text, onDone) {
    const msgs = document.getElementById('chat-messages');
    if (!msgs) return;

    // Typing indicator
    const typing = document.createElement('div');
    typing.className = 'chat-bubble bot-bubble';
    typing.id = 'typing-indicator';
    typing.style.cssText = 'display:flex; align-items:center; gap:6px; padding:12px 16px; min-width:60px;';
    typing.innerHTML = `
        <span style="width:7px;height:7px;border-radius:50%;background:var(--text-muted);animation:chatDot 1.2s ease infinite;display:inline-block;"></span>
        <span style="width:7px;height:7px;border-radius:50%;background:var(--text-muted);animation:chatDot 1.2s ease 0.2s infinite;display:inline-block;"></span>
        <span style="width:7px;height:7px;border-radius:50%;background:var(--text-muted);animation:chatDot 1.2s ease 0.4s infinite;display:inline-block;"></span>
        <style>
          @keyframes chatDot {
            0%,80%,100%{transform:scale(0.7);opacity:0.4;}
            40%{transform:scale(1);opacity:1;}
          }
        </style>
    `;
    msgs.appendChild(typing);
    _scrollBottom();

    const delay = Math.min(600 + text.length * 12, 1800);

    setTimeout(() => {
        const ind = document.getElementById('typing-indicator');
        if (ind) ind.remove();

        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble bot-bubble';
        bubble.style.cssText = `
            background: var(--bg-card);
            border: 1px solid var(--border-subtle);
            border-radius: 4px 18px 18px 18px;
            padding: 12px 16px;
            font-size: 14px;
            line-height: 1.6;
            color: var(--text-primary);
            max-width: 85%;
            white-space: pre-line;
            animation: fadeInUp 0.3s ease;
        `;
        bubble.textContent = text;
        msgs.appendChild(bubble);
        _scrollBottom();
        if (onDone) onDone();
    }, delay);
}

function _userMessage(text) {
    const msgs = document.getElementById('chat-messages');
    if (!msgs) return;
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble user-bubble';
    bubble.style.cssText = `
        background: linear-gradient(135deg, var(--accent-primary), #5b21b6);
        border-radius: 18px 4px 18px 18px;
        padding: 10px 16px;
        font-size: 14px;
        color: white;
        max-width: 75%;
        align-self: flex-end;
        animation: fadeInRight 0.25s ease;
    `;
    bubble.textContent = text;
    msgs.appendChild(bubble);
    _scrollBottom();
}

/* ──────────────────────────────────────────────────────────
   PHASE 1 — Intake
   ────────────────────────────────────────────────────────── */
function _nextIntake() {
    if (_intakeStep >= INTAKE_STEPS.length) {
        _startSTARTPhase();
        return;
    }

    const step = INTAKE_STEPS[_intakeStep];
    const pct = Math.round((_intakeStep / (INTAKE_STEPS.length + START_QUESTIONS.length)) * 100);
    _updateProgress(pct);

    _botMessage(step.text, () => _renderIntakeInput(step));
}

function _renderIntakeInput(step) {
    const area = document.getElementById('chat-input-area');
    if (!area) return;

    if (step.type === 'chips' || step.type === 'chips_plus_text') {
        let html = `<div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:${step.type === 'chips_plus_text' ? '10px' : '0'};">`;
        step.chips.forEach(chip => {
            html += `<button onclick="_intakeChipAnswer('${chip.replace(/'/g, "\\'")}', '${step.id}')"
                style="background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.15);
                       color:var(--text-primary); padding:8px 14px; border-radius:100px;
                       font-size:13px; cursor:pointer; transition:all 0.2s;"
                onmouseover="this.style.borderColor='var(--accent-teal)';this.style.color='var(--accent-teal)';"
                onmouseout="this.style.borderColor='rgba(255,255,255,0.15)';this.style.color='var(--text-primary)';"
            >${chip}</button>`;
        });
        html += '</div>';

        if (step.type === 'chips_plus_text') {
            html += `
                <div style="display:flex; gap:8px; align-items:center;">
                    <input id="intake-text-input"
                        type="text"
                        placeholder="${step.placeholder || 'Type here…'}"
                        style="flex:1; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15);
                               color:var(--text-primary); padding:10px 14px; border-radius:12px;
                               font-size:14px; outline:none;"
                        onkeypress="if(event.key==='Enter'){_intakeTextAnswer('${step.id}')}"
                    />
                    <button onclick="_intakeTextAnswer('${step.id}')"
                        style="background:var(--accent-teal); border:none; color:white;
                               padding:10px 16px; border-radius:12px; font-size:14px; cursor:pointer;">
                        →
                    </button>
                    <button onclick="_startVoiceIntake('${step.id}')" title="Voice input"
                        style="background:rgba(139,92,246,0.2); border:1px solid rgba(139,92,246,0.4);
                               color:#a78bfa; padding:10px 12px; border-radius:12px; font-size:16px; cursor:pointer;">
                        🎤
                    </button>
                </div>
            `;
        }
        area.innerHTML = html;

    } else if (step.type === 'slider') {
        area.innerHTML = `
            <div style="padding:4px 0;">
                <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-muted); margin-bottom:6px; font-family:var(--font-display); letter-spacing:0.05em;">
                    <span>${step.labels[0]}</span><span>${step.labels[1]}</span><span>${step.labels[2]}</span>
                </div>
                <div style="display:flex; align-items:center; gap:12px;">
                    <input type="range" id="pain-slider" min="${step.min}" max="${step.max}" value="${step.default}"
                        style="flex:1; accent-color:var(--accent-teal);"
                        oninput="document.getElementById('pain-val').textContent=this.value;"
                    />
                    <span id="pain-val" style="font-family:var(--font-display); font-size:22px; font-weight:800; color:var(--accent-teal); min-width:28px; text-align:center;">${step.default}</span>
                </div>
                <button onclick="_intakeSliderAnswer('${step.id}')"
                    style="width:100%; margin-top:10px; background:var(--accent-teal); border:none;
                           color:white; padding:11px; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer;">
                    Confirm Pain Level
                </button>
            </div>
        `;
    }
}

function _intakeChipAnswer(value, stepId) {
    _intakeData[stepId] = value;
    _userMessage(value);
    _clearInput();
    if (navigator.vibrate) navigator.vibrate(40);
    _intakeStep++;
    setTimeout(() => _nextIntake(), 500);
}

function _intakeTextAnswer(stepId) {
    const input = document.getElementById('intake-text-input');
    const value = input ? input.value.trim() : '';
    if (!value) return;
    _intakeData[stepId] = value;
    _userMessage(value);
    _clearInput();
    _intakeStep++;
    setTimeout(() => _nextIntake(), 500);
}

function _intakeSliderAnswer(stepId) {
    const slider = document.getElementById('pain-slider');
    const value = slider ? parseInt(slider.value) : 5;
    const label = value <= 3 ? 'Mild pain' : value <= 6 ? 'Moderate pain' : value <= 8 ? 'Severe pain' : 'Unbearable pain';
    _intakeData[stepId] = value;
    _userMessage(`${value}/10 — ${label}`);
    _clearInput();
    _intakeStep++;
    setTimeout(() => _nextIntake(), 500);
}

function _startVoiceIntake(stepId) {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
        return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.lang = 'en-IN';
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
        const txt = e.results[0][0].transcript;
        _intakeData[stepId] = txt;
        _userMessage(`🎤 "${txt}"`);
        _clearInput();
        _intakeStep++;
        setTimeout(() => _nextIntake(), 500);
    };
    r.onerror = () => { };
    r.start();
}

/* ──────────────────────────────────────────────────────────
   PHASE 2 — START Protocol
   ────────────────────────────────────────────────────────── */
function _startSTARTPhase() {
    _chatPhase = 'start';
    const badge = document.getElementById('chat-phase-badge');
    if (badge) {
        badge.textContent = 'START PROTOCOL';
        badge.style.background = 'rgba(239,68,68,0.15)';
        badge.style.color = '#f87171';
        badge.style.borderColor = 'rgba(239,68,68,0.3)';
    }

    // Personalise transition message
    const who = _intakeData['patient_type'] || 'the patient';
    const complaint = _intakeData['chief_complaint'] || 'the reported symptoms';
    const pain = _intakeData['pain_scale'];

    let transMsg = `Understood. `;
    if (pain >= 8) transMsg += `⚠️ Pain level ${pain}/10 is very high. `;
    transMsg += `Now running the clinical START triage protocol for ${who.toLowerCase()} with ${complaint.toLowerCase()}.\n\nI'll ask ${START_QUESTIONS.length} rapid assessment questions. Answer quickly — this is time-critical.`;

    _botMessage(transMsg, () => {
        setTimeout(() => _pushSTARTQuestion(1), 600);
    });
}

function _pushSTARTQuestion(qId) {
    const q = START_QUESTIONS.find(x => x.id === qId);
    if (!q) return;
    _startQId = qId;

    const total = INTAKE_STEPS.length + START_QUESTIONS.length;
    const done = INTAKE_STEPS.length + (qId - 1);
    _updateProgress(Math.round((done / total) * 100));

    _botMessage(
        `${q.critical ? '⚠️ ' : ''}Q${qId}/${START_QUESTIONS.length}: ${q.text}`,
        () => _renderSTARTButtons(q)
    );
}

function _renderSTARTButtons(q) {
    const area = document.getElementById('chat-input-area');
    if (!area) return;

    area.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:8px;">
            <button onclick="_submitSTART(true)"
                style="background:rgba(20,184,166,0.15); border:1px solid rgba(20,184,166,0.4);
                       color:#5eead4; font-size:14px; font-weight:600; padding:12px 16px;
                       border-radius:12px; cursor:pointer; text-align:left; transition:all 0.15s;"
                onmouseover="this.style.background='rgba(20,184,166,0.25)'"
                onmouseout="this.style.background='rgba(20,184,166,0.15)'">
                ${q.choices[0]}
            </button>
            <button onclick="_submitSTART(false)"
                style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3);
                       color:#f87171; font-size:14px; font-weight:600; padding:12px 16px;
                       border-radius:12px; cursor:pointer; text-align:left; transition:all 0.15s;"
                onmouseover="this.style.background='rgba(239,68,68,0.2)'"
                onmouseout="this.style.background='rgba(239,68,68,0.1)'">
                ${q.choices[1]}
            </button>
        </div>
    `;
}

function _submitSTART(isYes) {
    const q = START_QUESTIONS.find(x => x.id === _startQId);
    if (!q) return;

    const answerText = isYes ? q.choices[0] : q.choices[1];
    const nextCode = isYes ? q.yesNext : q.noNext;

    _userMessage(answerText);
    _clearInput();
    if (navigator.vibrate) navigator.vibrate(40);

    setTimeout(() => {
        if (nextCode < 0) {
            _pushResult(String(nextCode));
        } else {
            _pushSTARTQuestion(nextCode);
        }
    }, 450);
}

/* ──────────────────────────────────────────────────────────
   PHASE 3 — Result
   ────────────────────────────────────────────────────────── */
function _pushResult(code) {
    _updateProgress(100);
    _chatPhase = 'result';

    const res = START_RESULTS[code];
    if (!res) return;

    const badge = document.getElementById('chat-phase-badge');
    if (badge) {
        badge.textContent = res.category;
        badge.style.background = res.color + '22';
        badge.style.color = res.color;
        badge.style.borderColor = res.color + '66';
    }

    // Save to history
    if (typeof Storage !== 'undefined') {
        Storage.addHistory({
            symptoms: _intakeData['chief_complaint'] || 'Triage chat assessment',
            urgency: res.urgency,
            detectedSymptoms: [],
            resultData: {
                urgency: res.urgency,
                actions: res.firstAid,
                firstAid: null,
                category: res.category,
                title: res.title,
                description: res.desc
            }
        });
    }

    // Summary message before the result card
    const painNote = _intakeData['pain_scale'] ? ` Pain level was reported at ${_intakeData['pain_scale']}/10.` : '';
    _botMessage(
        `Assessment complete for ${(_intakeData['patient_type'] || 'patient').toLowerCase()}.${painNote} Based on the START protocol responses:`,
        () => {
            setTimeout(() => _renderResultCard(res), 400);
        }
    );

    // Emergency overlay for RED
    if (res.category === 'RED') {
        setTimeout(() => _showChatEmergencyFlash(), 600);
    }
}

function _renderResultCard(res) {
    const msgs = document.getElementById('chat-messages');
    if (!msgs) return;

    const firstAidHTML = res.firstAid.map((step, i) =>
        `<div style="display:flex; gap:10px; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
            <span style="font-family:var(--font-display); font-size:11px; font-weight:800; color:${res.color}; min-width:20px; margin-top:1px;">${i + 1}</span>
            <span style="font-size:13px; color:var(--text-primary); line-height:1.5;">${step}</span>
        </div>`
    ).join('');

    const doNotHTML = res.doNot.map(d =>
        `<div style="display:flex; gap:8px; align-items:flex-start; margin-top:4px;">
            <span style="color:#ef4444; font-size:12px; margin-top:1px;">✗</span>
            <span style="font-size:12px; color:var(--text-muted);">${d}</span>
        </div>`
    ).join('');

    const card = document.createElement('div');
    card.style.cssText = `
        background: var(--bg-card);
        border: 2px solid ${res.color};
        border-radius: 16px;
        padding: 20px;
        animation: fadeInUp 0.4s ease;
    `;
    card.innerHTML = `
        <!-- Category Badge -->
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
            <span style="font-size:36px;">${res.icon}</span>
            <div>
                <div style="font-family:var(--font-display); font-size:11px; letter-spacing:0.15em; color:${res.color}; font-weight:800;">${res.category} PRIORITY</div>
                <div style="font-size:16px; font-weight:700; color:var(--text-primary); margin-top:2px;">${res.title}</div>
            </div>
        </div>

        <!-- Description -->
        <div style="font-size:13px; color:var(--text-secondary); line-height:1.6; margin-bottom:16px; padding:10px 12px; background:rgba(255,255,255,0.04); border-radius:8px; border-left:3px solid ${res.color};">
            ${res.desc}
        </div>

        <!-- First Aid Steps -->
        <div style="margin-bottom:14px;">
            <div style="font-family:var(--font-display); font-size:10px; letter-spacing:0.12em; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px;">📋 First Aid Protocol</div>
            ${firstAidHTML}
        </div>

        <!-- Do Not -->
        <div style="margin-bottom:20px; padding:10px 12px; background:rgba(239,68,68,0.06); border-radius:8px;">
            <div style="font-family:var(--font-display); font-size:10px; letter-spacing:0.1em; color:#f87171; margin-bottom:6px;">⛔ DO NOT</div>
            ${doNotHTML}
        </div>

        <!-- Action Buttons -->
        <div style="display:flex; flex-direction:column; gap:10px;">
            ${res.callAmb ? `
                <a href="tel:108" onclick="if(navigator.vibrate)navigator.vibrate([200,100,300]);"
                   style="display:flex; align-items:center; justify-content:center; gap:10px;
                          background:#ef4444; color:white; text-decoration:none; padding:14px;
                          border-radius:12px; font-family:var(--font-display); font-size:14px;
                          font-weight:800; letter-spacing:0.08em; box-shadow:0 4px 20px rgba(239,68,68,0.4);">
                    📞 CALL 108 — AMBULANCE NOW
                </a>
            ` : ''}
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                <button onclick="_restartTriage()"
                    style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15);
                           color:var(--text-primary); padding:11px; border-radius:10px;
                           font-size:13px; cursor:pointer;">
                    🔄 New Assessment
                </button>
                <button onclick="Router.navigate('/firstaid')"
                    style="background:rgba(20,184,166,0.1); border:1px solid rgba(20,184,166,0.3);
                           color:var(--accent-teal); padding:11px; border-radius:10px;
                           font-size:13px; cursor:pointer;">
                    📖 First Aid Guide
                </button>
            </div>
        </div>
    `;

    msgs.appendChild(card);
    _scrollBottom();

    // Clear input area
    const area = document.getElementById('chat-input-area');
    if (area) area.innerHTML = '';

    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}

/* ──────────────────────────────────────────────────────────
   Emergency Flash (RED only)
   ────────────────────────────────────────────────────────── */
function _showChatEmergencyFlash() {
    if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 600]);

    const flash = document.createElement('div');
    flash.style.cssText = `
        position:fixed; inset:0; z-index:99999;
        background:rgba(220,0,0,0.85);
        display:flex; flex-direction:column; align-items:center; justify-content:center;
        gap:16px; animation:emergencyPulse 0.8s ease-in-out 3;
        pointer-events:none;
    `;
    flash.innerHTML = `
        <style>
          @keyframes emergencyPulse{from{opacity:0.6;}to{opacity:1;}}
        </style>
        <div style="font-size:60px;">🚨</div>
        <div style="font-family:var(--font-display);font-size:28px;font-weight:900;color:white;letter-spacing:0.15em;">IMMEDIATE</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.9);">Call 108 NOW</div>
    `;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 2400);
}

/* ──────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────── */
function _updateProgress(pct) {
    const fill = document.getElementById('chat-progress-fill');
    if (fill) fill.style.width = pct + '%';
}

function _clearInput() {
    const area = document.getElementById('chat-input-area');
    if (area) area.innerHTML = '';
}

function _scrollBottom() {
    const msgs = document.getElementById('chat-messages');
    if (msgs) setTimeout(() => { msgs.scrollTop = msgs.scrollHeight; }, 80);
}

function _restartTriage() {
    const page = document.getElementById('triage-chat-page');
    if (page) page.remove();
    const newPage = renderTriageChat();
    document.getElementById('app').appendChild(newPage);
}
