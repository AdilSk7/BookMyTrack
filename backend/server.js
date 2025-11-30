// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// ===============================
// Middleware
// ===============================
app.use(cors());
app.use(express.json());

// ===============================
// Database Connection
// ===============================
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bookmytrack';
mongoose.connect(MONGO_URI)
  .then(() => console.log('[mongo] connected'))
  .catch(err => console.error('[mongo] error', err));

// ===============================
// Admin Auth Import (IMPORTANT)
// ===============================
const { router: adminAuthRouter, verifyAdmin } = require('./routes/adminAuth');


// ===============================
// Public APIs
// ===============================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reservation', require('./routes/reservation'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/profile', require('./routes/profile'));

// ===============================
// Admin LOGIN (no token needed)
// ===============================
app.use('/api/admin', adminAuthRouter);

// ===============================
// Admin PROTECTED ROUTES
// ===============================
app.use('/api/admin', verifyAdmin, require('./routes/Admin'));

// ===============================
// Health Check
// ===============================
app.get('/', (_, res) => res.send('Backend is working!'));

// ===============================
// 404 Handler
// ===============================
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// ===============================
// Global Error Handler
// ===============================
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR]', err);
  res.status(500).json({ error: err.message || 'Server error' });
});

// ===============================
// Start Server
// ===============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[server] listening on ${PORT}`));
