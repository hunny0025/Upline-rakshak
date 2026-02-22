/* ===== Symptom Extraction Engine — Multilingual ===== */
let symptomDatabase = null;

// Hindi / Hinglish keyword expansions for each symptom ID
const HINDI_KEYWORDS = {
    chest_pain: ['seene mein dard', 'seene mein dard', 'dil mein dard', 'sina dard', 'seena dukh raha'],
    breathing_difficulty: ['saans lene mein takleef', 'saans nahi aa raha', 'dam ghut raha', 'saans phool raha', 'dama', 'nas phuli'],
    unconsciousness: ['behosh', 'behoshi', 'gir gaya', 'hosh nahi', 'unconscious ho gaya'],
    severe_bleeding: ['bahut khoon aa raha', 'zyada khoon', 'khoon nahi ruk raha', 'khoon beh raha'],
    seizure: ['mirgi', 'dora pada', 'jhatkay', 'jhatkay aana'],
    stroke_symptoms: ['lakwa', 'ek taraf kamzori', 'bolta nahi', 'chehra tedha'],
    high_fever: ['tez bukhar', 'bahut tez bukhar', '104 bukhar', 'jalaa raha hai'],
    headache: ['sir dard', 'sar dard', 'sar mein dard'],
    severe_headache: ['bahut tez sir dard', 'sir phat raha hai'],
    vomiting: ['ulti', 'ulti aa rahi', 'ji machla raha'],
    diarrhea: ['dast', 'loose motion', 'pet kharab', 'paani jaisa dast'],
    severe_abdominal_pain: ['pet mein bahut dard', 'pet dard bahut zyada'],
    fracture: ['haddi toot gayi', 'haddi tooti', 'haddi se awaaz aayi'],
    snake_bite: ['saanp ne kata', 'saanp ka kaata'],
    heat_stroke: ['loo lagi', 'garmi se behosh', 'dhoop mein girna'],
    electric_shock: ['current laga', 'bijli ka jhatkaa'],
    diabetic_emergency: ['sugar bahut kam', 'sugar bahut zyada', 'sugar patient', 'madhumeh'],
    asthma_attack: ['dama ka dora', 'inhaler kaam nahi kar raha', 'dama'],
    pregnancy_emergency: ['prasav', 'delivery ho rahi', 'pani toota', 'dard ho raha garbhavati'],
    dehydration: ['paani ki kami', 'bahut pyaas', 'peshab nahi ho raha'],
    mild_fever: ['thodaa bukhar', 'halka bukhar', 'bukhar hai'],
    cough: ['khansi', 'khansi nahi ruk rahi', 'bahut khansi'],
    sore_throat: ['gala kharab', 'gala dard', 'gale mein dard'],
    back_pain: ['kamar dard', 'peeth dard', 'kamar akad gayi'],
    abdominal_pain: ['pet dard', 'navel ke paas dard'],
    dizziness: ['chakkar', 'sir ghoom raha', 'chakkar aa raha'],
    joint_pain: ['jodon mein dard', 'ghutno mein dard', 'jod dard'],
    urinary_problems: ['peshab mein jalan', 'peshab mein khoon', 'peshab nahi ho raha'],
    palpitations: ['dil dhadak raha', 'dil tez chal raha', 'dil ki dharkan tez'],
    ear_pain: ['kaan mein dard', 'kaan dard'],
    tooth_pain: ['daant dard', 'dant dard'],
    insect_bite: ['kide ne kata', 'bichhu ne kata', 'kutton ne kata'],
    cut_wound: ['kaat laga', 'chot lagi', 'ghav hai'],
    confusion: ['samajh nahi aa raha', 'bewajah bol raha', 'hosh thik nahi'],
    eye_injury: ['aankh mein chot', 'aankh se khoon'],
    numbness: ['haath sonn ho gaya', 'pair sonn ho gaya', 'sunn']
};

// Tamil basic keywords
const TAMIL_KEYWORDS = {
    chest_pain: ['maarbu vali', 'nenju vali'],
    breathing_difficulty: ['maarppu iyakam', 'swaasam edukka mudiyavillai'],
    unconsciousness: ['mayakkam', 'ninavu illai'],
    high_fever: ['adhiga juram', 'juram'],
    headache: ['thalai vali'],
    vomiting: ['vanthi'],
    snake_bite: ['paambu kaditha'],
    seizure: ['valippu'],
    diarrhea: ['pasai malam'],
    fracture: ['etumbu murindha'],
    severe_bleeding: ['adhiga iratha irappu'],
    heat_stroke: ['veyil nilai aapathu'],
    dehydration: ['neer pattam'],
    abdominal_pain: ['vayiru vali'],
    dizziness: ['thalai suzhal']
};

// Telugu basic keywords
const TELUGU_KEYWORDS = {
    chest_pain: ['rotti lo noppi', 'gundhe noppi', 'gurram noppi'],
    breathing_difficulty: ['swasa teesukovadaniki kashtam', 'udiraniki kashtam'],
    unconsciousness: ['murchha', 'telu chukkovadaniki', 'spruha taggipoyindi'],
    high_fever: ['adhika jvaram', 'jvaram', 'chala jvaram'],
    headache: ['tala noppi', 'tattu noppi'],
    vomiting: ['vamti', 'aayantranga vamti'],
    snake_bite: ['pamu kadite', 'paamu kadicha'],
    seizure: ['murchana', 'murcha', 'vibrations ochhayi'],
    diarrhea: ['virichallu', 'loose motions'],
    severe_bleeding: ['adhika raktha sravamu', 'chala rakta vasthundi'],
    fracture: ['ethambu virigindi', 'bone virigindi'],
    abdominal_pain: ['koodu noppi', 'potta noppi'],
    dizziness: ['talanu tirugadam', 'chakkar vastundi'],
    dehydration: ['neeru takkuva', 'neeru pattam'],
    heat_stroke: ['vepu davunu', 'edari lo padipovadam'],
    back_pain: ['ndupu noppi', 'meeda noppi'],
    joint_pain: ['keelaala noppi'],
    electric_shock: ['current tadichi'],
    diabetic_emergency: ['sugar takkuva', 'madhumeham'],
    asthma_attack: ['dammu vayadam', 'astma daadu'],
    cough: ['dugu', 'dugu vostundi'],
    mild_fever: ['chinna jvaram', 'kocche jvaram'],
    sore_throat: ['gollamu noppi'],
    ear_pain: ['chevi noppi'],
    confusion: ['ardham kaavadam ledhu', 'alochinchi matladadam ledhu'],
    numbness: ['cheti mottam poyindi', 'kaali mottam poyindi'],
    urinary_problems: ['meeru tagguvaindi', 'meeru kaalchadaniki noppi']
};

// Bengali keywords
const BENGALI_KEYWORDS = {
    chest_pain: ['buke byatha', 'chhati te byatha', 'hridaye byatha'],
    breathing_difficulty: ['sas nite kosto', 'dam bondo hoe jachhe', 'sas phula'],
    unconsciousness: ['behosh', 'behosh hoye gece', 'jnan nei'],
    severe_bleeding: ['onek rokto porche', 'rokto bondho hocche na'],
    seizure: ['khichuni', 'mirgi', 'jhat khaoa'],
    stroke_symptoms: ['pok mara', 'ek dike sithil', 'mukh baka'],
    high_fever: ['onek jwor', 'tej jwor', 'sharir puroche'],
    headache: ['mathe byatha', 'mathay byatha'],
    severe_headache: ['onek beshi mathe byatha', 'math phat rache'],
    vomiting: ['banty hocche', 'ulti hocche', 'ji muchle'],
    diarrhea: ['pakher shol', 'loose motion', 'pani payer'],
    severe_abdominal_pain: ['pete onek byatha', 'pet dhamke byatha'],
    fracture: ['haddi venga gece', 'haddi mota shobdho holo'],
    snake_bite: ['shaap kamor deche', 'shaap dachhe'],
    heat_stroke: ['rod lege gece', 'rod e pore gece'],
    electric_shock: ['current lagche', 'bidyut aaghaat'],
    diabetic_emergency: ['sugar kome gece', 'sugar bere gece', 'madhumeho'],
    asthma_attack: ['hapa roger akar', 'inhaler kaj korche na'],
    dehydration: ['paani kom', 'onek teshta', 'prashrab hocche na'],
    mild_fever: ['ektu jor', 'halka jor'],
    cough: ['kashi', 'kashi hocche', 'onek kashi'],
    dizziness: ['chakkar khacchi', 'math ghurche'],
    abdominal_pain: ['pete byatha'],
    back_pain: ['kamar byatha'],
    joint_pain: ['ganthir byatha'],
    confusion: ['bujhte parchhi na', 'osathi katho'],
    numbness: ['hat shuiye gece', 'pa shuiye gece']
};

const SymptomEngine = {
    async init() {
        if (!symptomDatabase) {
            const res = await fetch('./data/symptoms.json');
            symptomDatabase = await res.json();
        }
    },

    /**
     * Extract symptoms from raw text (multilingual: English, Hindi, Tamil, Telugu).
     */
    extract(text) {
        if (!symptomDatabase) return [];

        const input = text.toLowerCase().trim();
        if (!input) return [];

        const matched = [];
        const matchedIds = new Set();

        for (const symptom of symptomDatabase.symptoms) {
            if (matchedIds.has(symptom.id)) continue;

            // --- English: keywords + synonyms ---
            const englishKwMatches = symptom.keywords.filter(kw => input.includes(kw)).length;
            const englishSynMatches = symptom.synonyms.filter(syn => input.includes(syn.toLowerCase())).length;
            const englishMatchCount = englishKwMatches + englishSynMatches;
            const englishMatch = englishMatchCount > 0;

            // --- Hindi / Hinglish ---
            const hindiKws = HINDI_KEYWORDS[symptom.id] || [];
            const hindiMatchCount = hindiKws.filter(kw => input.includes(kw)).length;
            const hindiMatch = hindiMatchCount > 0;

            // --- Tamil ---
            const tamilKws = TAMIL_KEYWORDS[symptom.id] || [];
            const tamilMatchCount = tamilKws.filter(kw => input.includes(kw)).length;
            const tamilMatch = tamilMatchCount > 0;

            // --- Telugu ---
            const teluguKws = TELUGU_KEYWORDS[symptom.id] || [];
            const teluguMatchCount = teluguKws.filter(kw => input.includes(kw)).length;
            const teluguMatch = teluguMatchCount > 0;

            // --- Bengali ---
            const bengaliKws = BENGALI_KEYWORDS[symptom.id] || [];
            const bengaliMatchCount = bengaliKws.filter(kw => input.includes(kw)).length;
            const bengaliMatch = bengaliMatchCount > 0;

            const anyMatch = englishMatch || hindiMatch || tamilMatch || teluguMatch || bengaliMatch;

            if (anyMatch) {
                matchedIds.add(symptom.id);

                // Confidence: based on total keyword hits across all languages, capped at 1.0
                const totalHits = englishMatchCount + hindiMatchCount + tamilMatchCount + teluguMatchCount + bengaliMatchCount;
                const totalKws = symptom.keywords.length + (symptom.synonyms || []).length +
                    hindiKws.length + tamilKws.length + teluguKws.length + bengaliKws.length;
                const rawScore = totalHits / Math.max(totalKws, 1);
                // Minimum confidence 0.4 for single match, scales up with more hits
                const confidence = Math.min(1.0, Math.max(0.40, rawScore * 3 + (totalHits > 1 ? 0.2 : 0)));

                matched.push({
                    id: symptom.id,
                    name: symptom.name,
                    severity: symptom.severity,
                    bodySystem: symptom.bodySystem,
                    confidence: Math.round(confidence * 100) / 100
                });
            }
        }

        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        matched.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));

        return matched;
    },

    getAllSymptoms() {
        if (!symptomDatabase) return [];
        return symptomDatabase.symptoms.map(s => ({ id: s.id, name: s.name, severity: s.severity }));
    }
};
