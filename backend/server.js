const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// ── CORS — allow frontend origin(s) ─────────────────────────────────────
const ALLOWED_ORIGINS = [
    // Production frontend on Render
    process.env.FRONTEND_URL,
    // Local development
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    // Render preview URLs (any *.onrender.com subdomain)
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (Postman, curl, same-origin)
        if (!origin) return callback(null, true);
        if (
            ALLOWED_ORIGINS.includes(origin) ||
            origin.endsWith('.onrender.com')
        ) {
            return callback(null, true);
        }
        callback(new Error(`CORS: Origin '${origin}' not allowed`));
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ───────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── Health Check ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Upline Backend is running',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Upline Backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    if (process.env.FRONTEND_URL) {
        console.log(`🔗 Accepting requests from: ${process.env.FRONTEND_URL}`);
    }
});
