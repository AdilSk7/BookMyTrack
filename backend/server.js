require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// CORS options to restrict access to your frontend domain
const corsOptions = {
  origin: process.env.FRONTEND_URL, // Use the frontend URL from the environment
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, // Enable credentials (cookies, authorization headers)
};

// --- Middleware ---
app.use(cors(corsOptions));
app.use(express.json());

// DB connect
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bookmytrack';
mongoose.connect(MONGO_URI)
  .then(() => console.log('[mongo] connected'))
  .catch(err => console.error('[mongo] error', err));

// --- API routes (mount BEFORE 404) ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reservation', require('./routes/reservation'));
app.use('/api/payment', require('./routes/payment'));

// Profile (read-only)
app.use('/api/profile', require('./routes/profile'));

// Health
app.get('/', (_, res) => res.send('Backend is working!'));

// --- 404 + error handlers LAST ---
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR]', err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

// --- Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[server] listening on ${PORT}`));
