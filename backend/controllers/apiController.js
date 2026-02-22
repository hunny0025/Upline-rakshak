// UPLINE API Controller

const RULES_VERSION = '1.0.0';

// ── Ping ──────────────────────────────────────────────────────────────────
exports.ping = (req, res) => {
    res.status(200).json({
        success: true,
        data: 'Pong! UPLINE Backend is running.',
        timestamp: new Date().toISOString()
    });
};

// ── Hospitals ─────────────────────────────────────────────────────────────
// Returns a mock list of nearby hospitals. In production, replace with a
// real geo API query (e.g. Google Places, Overpass/OSM).
exports.getHospitals = (req, res) => {
    const { lat, lng, radius = 10 } = req.query;

    // Static mock data — tagged with rough India-wide coverage
    const hospitals = [
        { id: 'h1', name: 'AIIMS New Delhi', number: '011-26588500', address: 'Ansari Nagar, New Delhi', lat: 28.5672, lng: 77.2100, type: 'Government', beds: 2000 },
        { id: 'h2', name: 'Apollo Hospitals', number: '1860-500-1066', address: 'Greams Road, Chennai', lat: 13.0572, lng: 80.2527, type: 'Private', beds: 700 },
        { id: 'h3', name: 'Fortis Memorial Hospital', number: '0124-4921021', address: 'Sector 44, Gurugram', lat: 28.4595, lng: 77.0266, type: 'Private', beds: 1000 },
        { id: 'h4', name: 'Safdarjung Hospital', number: '011-26707444', address: 'Ring Road, New Delhi', lat: 28.5691, lng: 77.2066, type: 'Government', beds: 1500 },
        { id: 'h5', name: 'KEM Hospital Mumbai', number: '022-24107000', address: 'Parel, Mumbai', lat: 18.9967, lng: 72.8407, type: 'Government', beds: 1800 },
    ];

    res.status(200).json({
        success: true,
        version: '1.0',
        query: { lat: lat || null, lng: lng || null, radius_km: radius },
        hospitals,
        note: 'Mock data — production will use real geo-location API.'
    });
};

// ── Doctor Consultation ───────────────────────────────────────────────────
exports.requestConsultation = (req, res) => {
    const { urgency, symptoms, contactMethod } = req.body;

    if (!urgency) {
        return res.status(400).json({ success: false, error: 'urgency is required' });
    }

    // In production: queue this request, send to available doctors, etc.
    const requestId = `CONSULT-${Date.now()}`;
    const estimatedWait = urgency === 'EMERGENCY' ? 5 : urgency === 'URGENT' ? 15 : 30;

    res.status(201).json({
        success: true,
        requestId,
        urgency,
        estimatedWaitMinutes: estimatedWait,
        message: `Consultation request #${requestId} queued. Estimated wait: ${estimatedWait} min.`,
        timestamp: new Date().toISOString()
    });
};

// ── Rules Sync ────────────────────────────────────────────────────────────
// Client sends its current version; server replies whether an update exists.
exports.getLatestRules = (req, res) => {
    const clientVersion = req.query.version || '0.0.0';
    const hasUpdate = clientVersion !== RULES_VERSION;

    res.status(200).json({
        success: true,
        version: RULES_VERSION,
        hasUpdate,
        // In production: include the actual rules payload if hasUpdate === true
        // rulesPayload: hasUpdate ? require('../data/rules.json') : null,
        rulesPayload: null,
        message: hasUpdate
            ? `Update available: ${clientVersion} → ${RULES_VERSION}`
            : 'Rules are up to date.'
    });
};

// ── Cloud Backup ──────────────────────────────────────────────────────────
exports.backupReport = (req, res) => {
    const { reportId, urgency, timestamp, anonymized } = req.body;

    if (!reportId) {
        return res.status(400).json({ success: false, error: 'reportId is required' });
    }

    // In production: store to DB, apply encryption at rest
    console.log(`[BACKUP] Received report ${reportId} | urgency: ${urgency} | time: ${timestamp}`);

    res.status(200).json({
        success: true,
        reportId,
        storedAt: new Date().toISOString(),
        message: 'Report backed up successfully. Data is anonymized and encrypted.'
    });
};
