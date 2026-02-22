/* ===================================================================
   UPLINE — Production Triage Chatbot Engine
   Multi-pathway clinical assessment with real branching logic
   =================================================================== */

/* ── Urgency Scoring Constants ──────────────────────────────────── */
const U = { IMMEDIATE: 4, URGENT: 3, DELAYED: 2, MINOR: 1 };

/* ── RED FLAGS — any match → immediate escalation ───────────────── */
const RED_FLAG_PHRASES = [
    'not breathing', 'stopped breathing', 'no pulse', 'unresponsive', 'unconscious',
    'not waking', 'blue lips', 'blue face', 'coughing blood', 'vomiting blood',
    'seizure', 'convulsion', 'paralysis', 'can\'t move', 'chest crushing',
    'worst headache', 'anaphylaxis', 'throat closing', 'can\'t swallow'
];

/* ── Condition Pathways ─────────────────────────────────────────── */
/* Each pathway is an array of question nodes:
   { id, text, type:'yn'|'chips'|'scale'|'text', choices[],
     score: { yes:N, no:N } or { [chip]: N },
     redFlag: bool  — if answered critically, escalate immediately
     next: 'id' | fn(answer) => 'id' | null (end)
   }
*/

const PATHWAYS = {

    chest_pain: [
        {
            id: 'cp1', text: 'Is the chest pain crushing, squeezing or pressure-like (not sharp)?',
            type: 'yn', choices: ['Yes — crushing/pressure', 'No — sharp/stabbing'],
            score: { yes: U.IMMEDIATE, no: 0 }, redFlag: true,
            next: a => a === 'yes' ? 'cp2' : 'cp_sharp'
        },
        {
            id: 'cp2', text: 'Does the pain spread to the left arm, jaw, neck or back?',
            type: 'yn', choices: ['Yes — radiating', 'No — localised'],
            score: { yes: U.IMMEDIATE, no: U.URGENT }, redFlag: true, next: 'cp3'
        },
        {
            id: 'cp3', text: 'Is there sweating, nausea or dizziness along with the pain?',
            type: 'yn', choices: ['Yes — all/some', 'No'],
            score: { yes: U.IMMEDIATE, no: 0 }, redFlag: true, next: 'cp4'
        },
        {
            id: 'cp4', text: 'Is breathing difficult or is the person gasping?',
            type: 'yn', choices: ['Yes — breathing difficulty', 'No — breathing OK'],
            score: { yes: U.IMMEDIATE, no: 0 }, redFlag: true, next: null
        },

        {
            id: 'cp_sharp', text: 'Is the pain worse when pressing the chest or breathing in?',
            type: 'yn', choices: ['Yes — worse on pressure/breath', 'No'],
            score: { yes: U.DELAYED, no: U.URGENT }, next: 'cp_sharp2'
        },
        {
            id: 'cp_sharp2', text: 'Any recent injury, fall or strenuous activity?',
            type: 'yn', choices: ['Yes', 'No'],
            score: { yes: U.DELAYED, no: U.URGENT }, next: null
        },
    ],

    breathing: [
        {
            id: 'br1', text: 'Is the person breathing at all?',
            type: 'yn', choices: ['Yes — barely/struggling', 'No — not breathing'],
            score: { yes: U.IMMEDIATE, no: U.IMMEDIATE }, redFlag: true,
            next: a => a === 'no' ? 'br_cpr' : 'br2'
        },
        {
            id: 'br_cpr', text: '⚠️ Not breathing. Is anyone nearby trained in CPR?',
            type: 'yn', choices: ['Yes — starting CPR', 'No — calling for help'],
            score: { yes: 0, no: 0 }, redFlag: true, next: null
        },
        {
            id: 'br2', text: 'Can you count breathing rate? How many breaths in 15 seconds?',
            type: 'chips', choices: ['1–4 (very slow)', '5–7 (normal)', '8–10 (fast)', '11+ (very fast)'],
            score: { '1–4 (very slow)': U.IMMEDIATE, '5–7 (normal)': U.DELAYED, '8–10 (fast)': U.URGENT, '11+ (very fast)': U.IMMEDIATE },
            redFlag: true, next: 'br3'
        },
        {
            id: 'br3', text: 'Is there a wheeze, stridor (barking sound) or gurgling?',
            type: 'yn', choices: ['Yes — abnormal sounds', 'No — quiet breathing'],
            score: { yes: U.IMMEDIATE, no: 0 }, redFlag: true, next: 'br4'
        },
        {
            id: 'br4', text: 'Is the patient sitting upright trying hard to breathe (tripod position)?',
            type: 'yn', choices: ['Yes — tripod / hunched', 'No'],
            score: { yes: U.IMMEDIATE, no: 0 }, next: null
        },
    ],

    bleeding: [
        {
            id: 'bl1', text: 'Is the bleeding spurting (arterial) or flowing heavily?',
            type: 'yn', choices: ['Yes — spurting/heavy flow', 'No — oozing/slow'],
            score: { yes: U.IMMEDIATE, no: U.URGENT }, redFlag: true, next: 'bl2'
        },
        {
            id: 'bl2', text: 'Where is the source of bleeding?',
            type: 'chips', choices: ['Head/neck', 'Chest/abdomen', 'Limb', 'Multiple sites', 'Unknown internal'],
            score: { 'Head/neck': U.IMMEDIATE, 'Chest/abdomen': U.IMMEDIATE, 'Limb': U.URGENT, 'Multiple sites': U.IMMEDIATE, 'Unknown internal': U.IMMEDIATE },
            redFlag: true, next: 'bl3'
        },
        {
            id: 'bl3', text: 'Has direct firm pressure been applied to the wound?',
            type: 'yn', choices: ['Yes — pressure applied', 'No — not yet'],
            score: { yes: 0, no: 0 }, next: 'bl4'
        },
        {
            id: 'bl4', text: 'Is the patient feeling faint, confused or very pale?',
            type: 'yn', choices: ['Yes — dizzy/pale/confused', 'No — alert'],
            score: { yes: U.IMMEDIATE, no: 0 }, redFlag: true, next: null
        },
    ],

    stroke: [
        {
            id: 'st1', text: '🧠 FAST CHECK — Face: Is one side of the face drooping or numb?',
            type: 'yn', choices: ['Yes — face drooping', 'No'],
            score: { yes: U.IMMEDIATE, no: 0 }, redFlag: true, next: 'st2'
        },
        {
            id: 'st2', text: 'FAST — Arms: Can they raise BOTH arms and keep them up for 10 seconds?',
            type: 'yn', choices: ['No — one arm drifts/falls', 'Yes — both arms steady'],
            score: { yes: U.IMMEDIATE, no: 0 }, redFlag: true, next: 'st3'
        },
        {
            id: 'st3', text: 'FAST — Speech: Is speech slurred, garbled or unable to speak?',
            type: 'yn', choices: ['Yes — speech affected', 'No — speaking clearly'],
            score: { yes: U.IMMEDIATE, no: 0 }, redFlag: true, next: 'st4'
        },
        {
            id: 'st4', text: 'When did symptoms first appear?',
            type: 'chips', choices: ['<1 hour ago', '1–3 hours ago', '3–6 hours ago', '>6 hours ago', 'Unknown'],
            score: { '<1 hour ago': U.IMMEDIATE, '1–3 hours ago': U.IMMEDIATE, '3–6 hours ago': U.URGENT, '> 6 hours ago': U.URGENT, 'Unknown': U.IMMEDIATE },
            redFlag: true, next: 'st5'
        },
        {
            id: 'st5', text: 'Is there sudden severe headache, vision loss or confusion?',
            type: 'yn', choices: ['Yes — any of these', 'No'],
            score: { yes: U.IMMEDIATE, no: 0 }, redFlag: true, next: null
        },
    ],

    unconscious: [
        {
            id: 'un1', text: 'Is the person completely unresponsive to voice and touch?',
            type: 'yn', choices: ['Yes — no response', 'Responds slightly'],
            score: { yes: U.IMMEDIATE, no: U.URGENT }, redFlag: true, next: 'un2'
        },
        {
            id: 'un2', text: 'Is the airway open? (look for chest rise, listen for breath)',
            type: 'yn', choices: ['Yes — airway open', 'No — obstructed/unknown'],
            score: { yes: 0, no: U.IMMEDIATE }, redFlag: true, next: 'un3'
        },
        {
            id: 'un3', text: 'Do you know what caused the loss of consciousness?',
            type: 'chips', choices: ['Fall/head injury', 'Seizure', 'Diabetic/fainting', 'Overdose/drugs', 'Heart/breathing', 'Unknown'],
            score: { 'Fall/head injury': U.IMMEDIATE, 'Seizure': U.IMMEDIATE, 'Diabetic/fainting': U.URGENT, 'Overdose/drugs': U.IMMEDIATE, 'Heart/breathing': U.IMMEDIATE, 'Unknown': U.IMMEDIATE },
            redFlag: true, next: 'un4'
        },
        {
            id: 'un4', text: 'Are there signs of seizure (muscle jerking, tongue bite, incontinence)?',
            type: 'yn', choices: ['Yes — seizure signs', 'No'],
            score: { yes: U.IMMEDIATE, no: 0 }, redFlag: true, next: null
        },
    ],

    burns: [
        {
            id: 'bu1', text: 'What caused the burn?',
            type: 'chips', choices: ['Fire/flame', 'Hot liquid/steam', 'Chemical', 'Electrical', 'Sunburn'],
            score: { 'Fire/flame': U.URGENT, 'Hot liquid/steam': U.URGENT, 'Chemical': U.IMMEDIATE, 'Electrical': U.IMMEDIATE, 'Sunburn': U.MINOR },
            next: 'bu2'
        },
        {
            id: 'bu2', text: 'How large is the burn? (palm of patient\'s hand = 1%)',
            type: 'chips', choices: ['<1% (tiny patch)', '1–9% (palm-sized)', '10–20% (arm/leg)', '20%+ (major areas)'],
            score: { '<1% (tiny patch)': U.MINOR, '1–9% (palm-sized)': U.DELAYED, '10–20% (arm/leg)': U.URGENT, '20%+ (major areas)': U.IMMEDIATE },
            redFlag: true, next: 'bu3'
        },
        {
            id: 'bu3', text: 'Is the burn on face, hands, genitals, or crossing a joint?',
            type: 'yn', choices: ['Yes — critical areas', 'No — other areas'],
            score: { yes: U.IMMEDIATE, no: 0 }, redFlag: true, next: 'bu4'
        },
        {
            id: 'bu4', text: 'Does the burned skin look white, brown or black (full thickness)?',
            type: 'yn', choices: ['Yes — white/brown/black', 'No — red and blistered'],
            score: { yes: U.IMMEDIATE, no: U.URGENT }, next: null
        },
    ],

    allergic: [
        {
            id: 'al1', text: 'Is there throat tightness, difficulty swallowing, or voice changes?',
            type: 'yn', choices: ['Yes — throat tightening', 'No'],
            score: { yes: U.IMMEDIATE, no: 0 }, redFlag: true, next: 'al2'
        },
        {
            id: 'al2', text: 'Is there hives or swelling of the face, lips or tongue?',
            type: 'yn', choices: ['Yes — swelling/hives', 'No'],
            score: { yes: U.IMMEDIATE, no: U.URGENT }, redFlag: true, next: 'al3'
        },
        {
            id: 'al3', text: 'Is there wheezing or breathing difficulty?',
            type: 'yn', choices: ['Yes — wheezing/difficulty', 'No'],
            score: { yes: U.IMMEDIATE, no: 0 }, redFlag: true, next: 'al4'
        },
        {
            id: 'al4', text: 'Is there an EpiPen (adrenaline auto-injector) available?',
            type: 'yn', choices: ['Yes — available', 'No'],
            score: { yes: 0, no: 0 }, next: null
        },
    ],

    head_injury: [
        {
            id: 'hi1', text: 'Was there any loss of consciousness after the impact?',
            type: 'yn', choices: ['Yes — lost consciousness', 'No'],
            score: { yes: U.IMMEDIATE, no: U.URGENT }, redFlag: true, next: 'hi2'
        },
        {
            id: 'hi2', text: 'Is the person confused, disoriented or unable to remember the injury?',
            type: 'yn', choices: ['Yes — confused/amnesic', 'No — clear memory'],
            score: { yes: U.URGENT, no: 0 }, redFlag: true, next: 'hi3'
        },
        {
            id: 'hi3', text: 'Any vomiting, severe headache, or unequal pupils since injury?',
            type: 'yn', choices: ['Yes — any of these', 'No'],
            score: { yes: U.IMMEDIATE, no: 0 }, redFlag: true, next: 'hi4'
        },
        {
            id: 'hi4', text: 'Is there clear fluid from nose or ears?',
            type: 'yn', choices: ['Yes — clear fluid', 'No'],
            score: { yes: U.IMMEDIATE, no: 0 }, redFlag: true, next: null
        },
    ],

    general: [
        {
            id: 'gn1', text: 'Can the person walk without support?',
            type: 'yn', choices: ['Yes — walking independently', 'No — cannot walk'],
            score: { yes: U.MINOR, no: U.URGENT }, next: 'gn2'
        },
        {
            id: 'gn2', text: 'Rate the pain level right now:',
            type: 'chips', choices: ['0–3 Mild', '4–6 Moderate', '7–9 Severe', '10 Unbearable'],
            score: { '0–3 Mild': U.MINOR, '4–6 Moderate': U.DELAYED, '7–9 Severe': U.URGENT, '10 Unbearable': U.IMMEDIATE },
            next: 'gn3'
        },
        {
            id: 'gn3', text: 'How long have symptoms been present?',
            type: 'chips', choices: ['< 30 min', '30 min – 2 hrs', '2–12 hrs', '> 12 hrs'],
            score: { '< 30 min': U.URGENT, '30 min – 2 hrs': U.DELAYED, '2–12 hrs': U.DELAYED, '> 12 hrs': U.MINOR },
            next: 'gn4'
        },
        {
            id: 'gn4', text: 'Are symptoms getting worse rapidly?',
            type: 'yn', choices: ['Yes — rapidly worsening', 'No — stable or improving'],
            score: { yes: U.URGENT, no: 0 }, next: null
        },
    ]
};

/* ── Chief Complaint → Pathway Mapping ──────────────────────────── */
const COMPLAINT_MAP = {
    'Chest pain / pressure': 'chest_pain',
    'Difficulty breathing': 'breathing',
    'Severe bleeding': 'bleeding',
    'Stroke symptoms (FAST)': 'stroke',
    'Unconscious / collapsed': 'unconscious',
    'Burns': 'burns',
    'Allergic reaction': 'allergic',
    'Head / spinal injury': 'head_injury',
    'Other / not sure': 'general'
};

/* ── Result Templates ───────────────────────────────────────────── */
const RESULT_META = {
    [U.IMMEDIATE]: {
        category: 'RED', label: 'IMMEDIATE', color: '#ef4444', icon: '🔴',
        callAmb: true,
        what: 'Life-threatening emergency requiring intervention within minutes.',
        paramedic: 'Patient is RED — immediate priority. Critical signs present.'
    },
    [U.URGENT]: {
        category: 'YELLOW', label: 'URGENT', color: '#f59e0b', icon: '🟡',
        callAmb: true,
        what: 'Serious condition. Needs medical care within 1 hour.',
        paramedic: 'Patient is YELLOW — urgent. Stable but requires prompt care.'
    },
    [U.DELAYED]: {
        category: 'YELLOW', label: 'DELAYED', color: '#fbbf24', icon: '🟠',
        callAmb: false,
        what: 'Non-life-threatening. Seek medical care within a few hours.',
        paramedic: 'Patient is DELAYED — serious but stable.'
    },
    [U.MINOR]: {
        category: 'GREEN', label: 'MINOR', color: '#14b8a6', icon: '🟢',
        callAmb: false,
        what: 'Minor condition. Treat with first aid, monitor for changes.',
        paramedic: 'Patient is GREEN — minor, walking wounded.'
    }
};

const FIRST_AID_BY_PATHWAY = {
    chest_pain: [
        'Sit patient upright — semi-reclined (not lying flat)',
        'Loosen tight clothing around chest and neck',
        'Keep patient calm and completely still',
        'If conscious and not allergic: 300mg Aspirin (chew, don\'t swallow whole)',
        'Do NOT give food or water',
        'If patient collapses and stops breathing: begin CPR',
        'Call 108 immediately — note time symptoms started'
    ],
    breathing: [
        'Sit patient upright leaning slightly forward (tripod position)',
        'Remove anything tight around neck or chest',
        'If inhaler prescribed for asthma: give 4 puffs every 4 minutes',
        'Keep patient calm — anxiety worsens breathing',
        'Do NOT lay patient flat',
        'If breathing stops: tilt head back, give rescue breaths, call 108'
    ],
    bleeding: [
        'Apply FIRM direct pressure with clean cloth — do not lift to check',
        'If limb: elevate above heart level if possible',
        'If object embedded: do NOT remove it — pack around it',
        'Tourniquet for limb bleeding that won\'t stop: apply 5cm above wound',
        'Keep patient warm and lying down',
        'Note time of injury and estimated blood loss for paramedics'
    ],
    stroke: [
        '⏱️ TIME IS CRITICAL — every minute = 2 million brain cells lost',
        'Call 108 immediately — note exact time symptoms started',
        'Lay patient on their side if unresponsive (recovery position)',
        'Do NOT give food, water, or medication',
        'Do NOT leave patient alone',
        'Keep patient still and calm until ambulance arrives',
        'Note: Last time patient was seen NORMAL (crucial for treatment eligibility)'
    ],
    unconscious: [
        'Check airway: tilt head back, lift chin — look for chest rise',
        'Recovery position: on left side to prevent choking',
        'Do NOT move if spinal injury suspected',
        'Check breathing every 30 seconds',
        'If no breathing: begin CPR (30 compressions : 2 breaths)',
        'Call 108 — stay on line with dispatcher'
    ],
    burns: [
        'Cool burn immediately with COOL running water for 20 minutes',
        'Do NOT use ice, butter, toothpaste or any home remedy',
        'Remove jewelry/clothing near burn BEFORE swelling',
        'Cover with cling film or clean damp cloth — do not burst blisters',
        'For chemical burns: brush off dry chemical, then rinse with water',
        'For electrical burns: do NOT touch patient if still connected to source'
    ],
    allergic: [
        'If EpiPen available: inject into outer mid-thigh immediately',
        'Call 108 — anaphylaxis can be fatal within minutes',
        'Lay patient flat with legs raised (unless breathing difficulty)',
        'Second EpiPen after 5–15 min if no improvement',
        'Do NOT give antihistamine as primary treatment for anaphylaxis',
        'Note allergen exposure for paramedics'
    ],
    head_injury: [
        'Do NOT move patient if spinal injury possible',
        'Keep head and neck in neutral position — manual stabilisation',
        'If conscious: keep awake and talking to them',
        'Apply pressure to scalp wounds but do NOT press on skull fracture',
        'Do NOT give any pain medication',
        'Monitor pupil size, breathing, and consciousness every 5 minutes'
    ],
    general: [
        'Keep patient calm and comfortable in safe position',
        'Monitor vital signs: breathing, pulse, consciousness every 5 minutes',
        'Apply appropriate first aid for visible wounds',
        'Do not leave patient unattended',
        'Be ready to escalate if condition worsens'
    ]
};

/* ================================================================
   CHATBOT STATE
   ================================================================ */
let _tc = {
    phase: 'greeting',      // greeting → intake → pathway → result
    pathway: null,          // key in PATHWAYS
    qIndex: 0,              // current question index in pathway
    totalScore: 0,          // cumulative urgency score
    maxScore: 0,            // max possible score
    peaked: null,           // highest single U score hit
    redFlagged: false,      // instant escalation
    patientAge: null,
    patientType: null,
    complaint: null,
    answers: {},            // { qId: answer }
    log: []                 // { q, a, timestamp }
};

/* ================================================================
   RENDER
   ================================================================ */
function renderTriageChat() {
    _tc = {
        phase: 'greeting', pathway: null, qIndex: 0, totalScore: 0, maxScore: 0,
        peaked: null, redFlagged: false, patientAge: null, patientType: null,
        complaint: null, answers: {}, log: []
    };

    const page = document.createElement('div');
    page.id = 'tc-page';
    page.className = 'page triage-chat-page';
    page.style.cssText = 'display:flex;flex-direction:column;height:100dvh;overflow:hidden;position:relative;';

    page.innerHTML = `
    <div id="tc-header" style="padding:12px 16px 8px;background:var(--bg-card);border-bottom:1px solid var(--border-subtle);display:flex;align-items:center;gap:10px;flex-shrink:0;">
      <button onclick="Router.navigate('/dashboard')" style="background:none;border:none;color:var(--text-muted);font-size:20px;cursor:pointer;line-height:1;padding:0 4px 0 0;">←</button>
      <div style="flex:1;">
        <div style="font-family:var(--font-display);font-size:11px;font-weight:900;letter-spacing:0.15em;color:var(--accent-primary);">UPLINE TRIAGE ENGINE</div>
        <div style="font-size:10px;color:var(--text-muted);">Clinical Assessment · START Protocol · Offline</div>
      </div>
      <div id="tc-badge" style="font-family:var(--font-display);font-size:9px;letter-spacing:0.1em;background:rgba(20,184,166,0.12);color:var(--accent-teal);padding:3px 10px;border-radius:100px;border:1px solid rgba(20,184,166,0.25);">INTAKE</div>
    </div>
    <div style="height:3px;background:rgba(255,255,255,0.06);flex-shrink:0;">
      <div id="tc-progress" style="height:100%;width:0%;background:linear-gradient(90deg,var(--accent-teal),var(--accent-primary));transition:width 0.6s ease;"></div>
    </div>
    <div id="tc-msgs" style="flex:1;overflow-y:auto;padding:16px;padding-bottom:150px;display:flex;flex-direction:column;gap:12px;"></div>
    <div id="tc-input" style="position:fixed;bottom:var(--nav-height,60px);left:0;width:100%;padding:10px 14px;background:rgba(10,10,20,0.97);backdrop-filter:blur(16px);border-top:1px solid var(--border-subtle);z-index:50;box-sizing:border-box;"></div>
  `;

    const style = document.createElement('style');
    style.textContent = `
    @keyframes tcFadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
    @keyframes tcDot{0%,80%,100%{transform:scale(0.6);opacity:0.3;}40%{transform:scale(1);opacity:1;}}
    .tc-bot{background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:4px 16px 16px 16px;padding:12px 15px;font-size:14px;line-height:1.65;color:var(--text-primary);max-width:88%;white-space:pre-line;animation:tcFadeUp 0.3s ease;}
    .tc-user{background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:16px 4px 16px 16px;padding:10px 15px;font-size:14px;color:white;max-width:78%;align-self:flex-end;animation:tcFadeUp 0.25s ease;}
    .tc-chip{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);color:var(--text-primary);padding:9px 15px;border-radius:100px;font-size:13px;cursor:pointer;transition:all 0.18s;white-space:nowrap;}
    .tc-chip:hover,.tc-chip:active{background:rgba(99,102,241,0.25);border-color:rgba(99,102,241,0.5);color:#a5b4fc;}
    .tc-yn-yes{background:rgba(20,184,166,0.1);border:1px solid rgba(20,184,166,0.35);color:#5eead4;padding:13px 16px;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;text-align:left;transition:all 0.18s;width:100%;}
    .tc-yn-no{background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);color:#f87171;padding:13px 16px;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;text-align:left;transition:all 0.18s;width:100%;}
    .tc-yn-yes:hover{background:rgba(20,184,166,0.2);}
    .tc-yn-no:hover{background:rgba(239,68,68,0.18);}
  `;
    page.appendChild(style);

    setTimeout(() => _tcGreeting(), 300);
    return page;
}

/* ================================================================
   MESSAGING
   ================================================================ */
function _tcBot(text, onDone, delay) {
    const msgs = document.getElementById('tc-msgs');
    if (!msgs) return;

    const ind = document.createElement('div');
    ind.className = 'tc-bot';
    ind.style.cssText = 'display:flex;align-items:center;gap:5px;min-width:52px;padding:14px 16px;';
    ind.innerHTML = `<span style="width:7px;height:7px;border-radius:50%;background:var(--text-muted);animation:tcDot 1.2s ease infinite;display:inline-block;"></span><span style="width:7px;height:7px;border-radius:50%;background:var(--text-muted);animation:tcDot 1.2s 0.2s ease infinite;display:inline-block;"></span><span style="width:7px;height:7px;border-radius:50%;background:var(--text-muted);animation:tcDot 1.2s 0.4s ease infinite;display:inline-block;"></span>`;
    msgs.appendChild(ind);
    _tcScroll();

    const wait = delay ?? Math.min(500 + text.length * 10, 1600);
    setTimeout(() => {
        ind.remove();
        const b = document.createElement('div');
        b.className = 'tc-bot';
        b.textContent = text;
        msgs.appendChild(b);
        _tcScroll();
        if (onDone) onDone();
    }, wait);
}

function _tcUser(text) {
    const msgs = document.getElementById('tc-msgs');
    if (!msgs) return;
    const b = document.createElement('div');
    b.className = 'tc-user';
    b.textContent = text;
    msgs.appendChild(b);
    _tcScroll();
}

function _tcScroll() {
    const m = document.getElementById('tc-msgs');
    if (m) setTimeout(() => { m.scrollTop = m.scrollHeight; }, 60);
}

function _tcSetInput(html) {
    const inp = document.getElementById('tc-input');
    if (inp) inp.innerHTML = html;
}

function _tcProgress(pct) {
    const p = document.getElementById('tc-progress');
    if (p) p.style.width = Math.min(100, pct) + '%';
}

function _tcBadge(text, color) {
    const b = document.getElementById('tc-badge');
    if (!b) return;
    b.textContent = text;
    b.style.cssText = `font-family:var(--font-display);font-size:9px;letter-spacing:0.1em;background:${color}22;color:${color};padding:3px 10px;border-radius:100px;border:1px solid ${color}55;`;
}

/* ================================================================
   PHASE 1 — GREETING + INTAKE
   ================================================================ */
function _tcGreeting() {
    _tcBot(
        "👋 I'm the UPLINE Triage Engine — a clinical first-responder assistant.\n\nI will guide you through a structured medical assessment to determine urgency and first-aid steps.\n\n⚡ Works fully offline. No data leaves your device.",
        () => setTimeout(_tcAskPatientType, 700)
    );
}

function _tcAskPatientType() {
    _tcProgress(5);
    _tcBot("First — who needs help?", () => {
        _tcSetInput(`<div style="display:flex;flex-wrap:wrap;gap:8px;">${['Myself', 'Another adult', 'A child (<12 yrs)', 'An elderly person (>65)'].map(c =>
            `<button class="tc-chip" onclick="_tcPatientType('${c}')">${c}</button>`
        ).join('')
            }</div>`);
    });
}

function _tcPatientType(val) {
    _tc.patientType = val;
    _tcUser(val);
    _tcSetInput('');
    if (navigator.vibrate) navigator.vibrate(40);
    setTimeout(_tcAskComplaint, 500);
}

function _tcAskComplaint() {
    _tcProgress(15);
    _tcBot("What is the main emergency? Choose the closest match:", () => {
        _tcSetInput(`<div style="display:flex;flex-wrap:wrap;gap:8px;">${Object.keys(COMPLAINT_MAP).map(c =>
            `<button class="tc-chip" onclick="_tcComplaint('${c.replace(/'/g, "\\'")}')">${c}</button>`
        ).join('')
            }</div>`);
    });
}

function _tcComplaint(val) {
    _tc.complaint = val;
    _tc.pathway = COMPLAINT_MAP[val] || 'general';
    _tcUser(val);
    _tcSetInput('');

    // Scan for red flags in complaint text
    const lower = val.toLowerCase();
    if (RED_FLAG_PHRASES.some(f => lower.includes(f))) {
        _tc.redFlagged = true;
    }

    // Update badge
    const pathLabels = {
        chest_pain: 'CARDIAC', breathing: 'RESPIRATORY', bleeding: 'HAEMORRHAGE',
        stroke: 'STROKE/FAST', unconscious: 'NEURO', burns: 'BURNS',
        allergic: 'ANAPHYLAXIS', head_injury: 'TRAUMA', general: 'GENERAL'
    };
    _tcBadge(pathLabels[_tc.pathway] || 'ASSESSMENT', '#a78bfa');

    setTimeout(() => {
        if (_tc.redFlagged) {
            _tcBot("⚠️ Based on what you've described, this may be life-threatening. I'm running the urgent assessment now.", () => {
                setTimeout(_tcRunPathway, 400);
            });
        } else {
            _tcBot(`Understood. Running ${pathLabels[_tc.pathway] || ''} assessment now...`, () => {
                setTimeout(_tcRunPathway, 400);
            });
        }
    }, 400);
}

/* ================================================================
   PHASE 2 — CLINICAL PATHWAY
   ================================================================ */
function _tcRunPathway() {
    const path = PATHWAYS[_tc.pathway] || PATHWAYS.general;
    const q = path[_tc.qIndex];
    if (!q) { _tcComputeResult(); return; }

    const total = path.length;
    const prog = 20 + Math.round((_tc.qIndex / total) * 65);
    _tcProgress(prog);

    _tcBot(`${q.redFlag ? '⚠️ ' : ''}${q.text}`, () => _tcRenderQ(q));
}

function _tcRenderQ(q) {
    if (q.type === 'yn') {
        _tcSetInput(`<div style="display:flex;flex-direction:column;gap:8px;">
      <button class="tc-yn-yes" onclick="_tcAnswer('${q.id}','yes','${_esc(q.choices[0])}')">${q.choices[0]}</button>
      <button class="tc-yn-no"  onclick="_tcAnswer('${q.id}','no','${_esc(q.choices[1])}')">${q.choices[1]}</button>
    </div>`);
    } else if (q.type === 'chips') {
        _tcSetInput(`<div style="display:flex;flex-wrap:wrap;gap:8px;">${q.choices.map(c => `<button class="tc-chip" onclick="_tcAnswer('${q.id}','${_esc(c)}','${_esc(c)}')">${c}</button>`).join('')
            }</div>`);
    }
}

function _tcAnswer(qId, value, label) {
    const path = PATHWAYS[_tc.pathway] || PATHWAYS.general;
    const q = path.find(x => x.id === qId);
    if (!q) return;

    _tc.answers[qId] = value;
    _tc.log.push({ q: q.text, a: label, t: new Date().toLocaleTimeString() });
    _tcUser(label);
    _tcSetInput('');
    if (navigator.vibrate) navigator.vibrate(35);

    // Score
    const sc = q.score;
    let pts = 0;
    if (q.type === 'yn') pts = sc[value] || 0;
    else pts = sc[value] || sc[label] || 0;
    _tc.totalScore += pts;
    if (!_tc.peaked || pts > _tc.peaked) _tc.peaked = pts;

    // Red flag check
    if (q.redFlag && pts >= U.IMMEDIATE) {
        _tc.redFlagged = true;
    }

    // Early escalation: 2 IMMEDIATE scores → stop and escalate
    const immediateHits = Object.entries(_tc.answers).filter((_, i) => {
        const pq = path.find(x => x.id === Object.keys(_tc.answers)[i]);
        if (!pq) return false;
        const s = pq.score;
        const v = Object.values(_tc.answers)[i];
        return (s[v] || 0) >= U.IMMEDIATE;
    }).length;

    if (immediateHits >= 2) {
        _tc.redFlagged = true;
        _tcSetInput('');
        setTimeout(() => {
            _tcBot("🚨 Critical signs detected — stopping assessment to escalate immediately.", () => {
                setTimeout(_tcComputeResult, 400);
            });
        }, 400);
        return;
    }

    // Advance
    _tc.qIndex++;
    setTimeout(_tcRunPathway, 450);
}

/* ================================================================
   PHASE 3 — RESULT
   ================================================================ */
function _tcComputeResult() {
    _tcProgress(100);
    _tc.phase = 'result';

    let urgency;
    if (_tc.redFlagged || _tc.peaked >= U.IMMEDIATE) {
        urgency = U.IMMEDIATE;
    } else if (_tc.peaked >= U.URGENT || _tc.totalScore >= U.URGENT * 2) {
        urgency = U.URGENT;
    } else if (_tc.peaked >= U.DELAYED || _tc.totalScore >= U.DELAYED * 2) {
        urgency = U.DELAYED;
    } else {
        urgency = U.MINOR;
    }

    // Age modifier
    if (_tc.patientType && (_tc.patientType.includes('child') || _tc.patientType.includes('elderly'))) {
        urgency = Math.min(U.IMMEDIATE, urgency + 1);
    }

    const meta = RESULT_META[urgency];
    const steps = FIRST_AID_BY_PATHWAY[_tc.pathway] || FIRST_AID_BY_PATHWAY.general;
    const confidence = Math.min(97, 70 + _tc.log.length * 4);

    // Save to history
    if (typeof Storage !== 'undefined') {
        Storage.addHistory({
            symptoms: _tc.complaint || 'Triage chat',
            urgency: urgency === U.IMMEDIATE ? 'EMERGENCY' : urgency === U.URGENT ? 'URGENT' : urgency === U.DELAYED ? 'MODERATE' : 'LOW',
            detectedSymptoms: [],
            resultData: { urgency: 'URGENT', actions: steps, firstAid: null }
        });
    }

    _tcBadge(meta.label, meta.color);

    // Emergency flash
    if (urgency === U.IMMEDIATE) _tcEmergencyFlash();

    _tcBot(`Assessment complete. ${_tc.log.length} parameters evaluated. Confidence: ${confidence}%.`, () => {
        setTimeout(() => _tcRenderResult(meta, steps, urgency, confidence), 500);
    });
}

function _tcRenderResult(meta, steps, urgency, confidence) {
    const msgs = document.getElementById('tc-msgs');
    if (!msgs) return;

    const stepsHTML = steps.map((s, i) => `
    <div style="display:flex;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
      <span style="font-family:var(--font-display);font-size:11px;font-weight:800;color:${meta.color};min-width:20px;margin-top:2px;">${i + 1}</span>
      <span style="font-size:13px;color:var(--text-primary);line-height:1.55;">${s}</span>
    </div>`).join('');

    const logHTML = _tc.log.map(l => `
    <div style="display:flex;gap:8px;font-size:11px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
      <span style="color:var(--text-muted);min-width:50px;">${l.t}</span>
      <span style="color:var(--text-secondary);flex:1;">${l.q.replace(/[⚠️🧠]/g, '').trim()}</span>
      <span style="color:${meta.color};font-weight:600;text-align:right;">${l.a}</span>
    </div>`).join('');

    const card = document.createElement('div');
    card.style.cssText = `background:var(--bg-card);border:2px solid ${meta.color};border-radius:16px;overflow:hidden;animation:tcFadeUp 0.4s ease;`;
    card.innerHTML = `
    <!-- Top banner -->
    <div style="background:${meta.color}18;padding:18px 18px 14px;border-bottom:1px solid ${meta.color}33;">
      <div style="display:flex;align-items:center;gap:14px;">
        <span style="font-size:42px;line-height:1;">${meta.icon}</span>
        <div>
          <div style="font-family:var(--font-display);font-size:10px;letter-spacing:0.15em;color:${meta.color};font-weight:800;">${meta.category} · ${meta.label}</div>
          <div style="font-size:16px;font-weight:700;color:var(--text-primary);margin-top:3px;">${meta.what}</div>
        </div>
      </div>
      <div style="display:flex;gap:12px;margin-top:12px;">
        <div style="flex:1;background:rgba(255,255,255,0.05);border-radius:8px;padding:8px 10px;text-align:center;">
          <div style="font-family:var(--font-display);font-size:18px;font-weight:900;color:${meta.color};">${confidence}%</div>
          <div style="font-size:9px;color:var(--text-muted);letter-spacing:0.08em;margin-top:1px;">CONFIDENCE</div>
        </div>
        <div style="flex:1;background:rgba(255,255,255,0.05);border-radius:8px;padding:8px 10px;text-align:center;">
          <div style="font-family:var(--font-display);font-size:18px;font-weight:900;color:var(--text-primary);">${_tc.log.length}</div>
          <div style="font-size:9px;color:var(--text-muted);letter-spacing:0.08em;margin-top:1px;">PARAMETERS</div>
        </div>
        <div style="flex:1;background:rgba(255,255,255,0.05);border-radius:8px;padding:8px 10px;text-align:center;">
          <div style="font-family:var(--font-display);font-size:12px;font-weight:900;color:var(--text-primary);">${Object.keys(COMPLAINT_MAP).find(k => COMPLAINT_MAP[k] === _tc.pathway) || 'General'}</div>
          <div style="font-size:9px;color:var(--text-muted);letter-spacing:0.08em;margin-top:1px;">PATHWAY</div>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div style="padding:16px 18px;">

      <!-- First Aid -->
      <div style="margin-bottom:16px;">
        <div style="font-family:var(--font-display);font-size:10px;letter-spacing:0.12em;color:var(--text-muted);text-transform:uppercase;margin-bottom:8px;">📋 First Aid Protocol</div>
        ${stepsHTML}
      </div>

      <!-- Paramedic Handoff -->
      <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:12px;margin-bottom:16px;border-left:3px solid ${meta.color};">
        <div style="font-family:var(--font-display);font-size:10px;letter-spacing:0.1em;color:${meta.color};margin-bottom:6px;">🚑 TELL PARAMEDICS</div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;">
          "${meta.paramedic} Patient: ${_tc.patientType || 'adult'}. Chief complaint: ${_tc.complaint || 'unknown'}. Assessment questions answered: ${_tc.log.length}."
        </div>
      </div>

      <!-- Assessment Log (collapsible) -->
      <details style="margin-bottom:16px;">
        <summary style="font-family:var(--font-display);font-size:10px;letter-spacing:0.1em;color:var(--text-muted);cursor:pointer;padding:6px 0;">▶ VIEW ASSESSMENT LOG (${_tc.log.length} entries)</summary>
        <div style="margin-top:8px;background:rgba(0,0,0,0.2);border-radius:8px;padding:10px;">
          ${logHTML}
        </div>
      </details>

      <!-- Action Buttons -->
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${meta.callAmb ? `
          <a href="tel:108" onclick="if(navigator.vibrate)navigator.vibrate([200,100,400]);"
            style="display:flex;align-items:center;justify-content:center;gap:10px;
                   background:#ef4444;color:white;text-decoration:none;padding:15px;
                   border-radius:12px;font-family:var(--font-display);font-size:14px;
                   font-weight:900;letter-spacing:0.08em;box-shadow:0 4px 24px rgba(239,68,68,0.45);">
            📞 CALL 108 — AMBULANCE NOW
          </a>
        ` : ''}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <button onclick="_tcRestart()"
            style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);
                   color:var(--text-primary);padding:12px;border-radius:10px;font-size:13px;cursor:pointer;">
            🔄 New Assessment
          </button>
          <button onclick="Router.navigate('/firstaid')"
            style="background:rgba(20,184,166,0.1);border:1px solid rgba(20,184,166,0.3);
                   color:var(--accent-teal);padding:12px;border-radius:10px;font-size:13px;cursor:pointer;">
            📖 First Aid Guide
          </button>
        </div>
      </div>
    </div>
  `;

    msgs.appendChild(card);
    _tcScroll();
    _tcSetInput('');
    if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
}

/* ================================================================
   EMERGENCY FLASH
   ================================================================ */
function _tcEmergencyFlash() {
    if (navigator.vibrate) navigator.vibrate([400, 100, 400, 100, 800]);
    const f = document.createElement('div');
    f.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(200,0,0,0.82);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;pointer-events:none;animation:tcFadeUp 0.2s ease;';
    f.innerHTML = `<div style="font-size:56px;">🚨</div><div style="font-family:var(--font-display);font-size:26px;font-weight:900;color:white;letter-spacing:0.18em;">CALL 108 NOW</div><div style="font-size:13px;color:rgba(255,255,255,0.85);">Life-threatening emergency detected</div>`;
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 2600);
}

/* ================================================================
   HELPERS
   ================================================================ */
function _esc(s) { return (s || '').replace(/'/g, "\\'").replace(/"/g, '&quot;'); }

function _tcRestart() {
    const old = document.getElementById('tc-page');
    if (old) old.remove();
    const app = document.getElementById('app');
    if (app) app.appendChild(renderTriageChat());
}
