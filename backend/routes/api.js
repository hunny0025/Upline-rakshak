const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

// Health / Ping
router.get('/ping', apiController.ping);

// Hospitals — returns nearby hospitals list (mock; replace with real geo API)
router.get('/hospitals', apiController.getHospitals);

// Doctor Consultation — stub request endpoint
router.post('/consultation', apiController.requestConsultation);

// Rules sync — returns current rules version + payload for client caching
router.get('/rules/latest', apiController.getLatestRules);

// Cloud Backup — receives anonymized triage report
router.post('/backup', apiController.backupReport);

module.exports = router;
