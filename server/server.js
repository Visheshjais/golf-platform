// ============================================================
// server.js — Entry point for the Golf Charity Platform API
// Loads env vars, connects DB, registers all routes, starts server
// ============================================================

const express = require('express');
const dotenv  = require('dotenv');
const cors    = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Load environment variables FIRST before any other imports
dotenv.config();

// Connect to MongoDB Atlas
connectDB();

const app = express();

// ─── Rate limiting (prevents brute-force attacks) ────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // max 100 requests per window per IP
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ─── CORS ─────────────────────────────────────────────────────
// Allows the React frontend to call this API
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ─── Body parsers ─────────────────────────────────────────────
// IMPORTANT: Stripe webhooks need raw body, so we parse it BEFORE json()
app.use('/api/subscriptions/webhook',
  express.raw({ type: 'application/json' })  // raw for Stripe signature verification
);
app.use(express.json());             // JSON body for all other routes
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/scores',        require('./routes/scoreRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));
app.use('/api/draws',         require('./routes/drawRoutes'));
app.use('/api/charities',     require('./routes/charityRoutes'));
app.use('/api/winners',       require('./routes/winnerRoutes'));
app.use('/api/admin',         require('./routes/adminRoutes'));

// ─── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ─── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
