// backend/routes/Admin.js
const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');

// Small helpers to handle dates
function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d)   { const x = new Date(d); x.setHours(23,59,59,999); return x; }

/**
 * GET /api/admin/stats
 * Returns high-level booking statistics for the dashboard.
 */
router.get('/stats', async (req, res) => {
  try {
    const total = await Reservation.countDocuments();
    const active = await Reservation.countDocuments({
      status: { $in: ['Pending', 'Confirmed', 'Paid'] }
    });
    const cancelled = await Reservation.countDocuments({ status: 'Cancelled' });

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const todayBookings = await Reservation.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd }
    });

    return res.json({
      total,
      active,
      cancelled,
      todayBookings
    });
  } catch (err) {
    console.error('[ADMIN STATS ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/reservations
 * Optional query params:
 *   - pnr
 *   - userId
 *   - date (YYYY-MM-DD, journey date)
 *   - status
 */
router.get('/reservations', async (req, res) => {
  try {
    const { pnr, userId, date, status } = req.query;
    const filter = {};

    if (pnr) filter.pnr = pnr.trim();
    if (userId) filter.userId = userId.trim();
    if (status) filter.status = status;

    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        filter.journeyDate = {
          $gte: startOfDay(d),
          $lte: endOfDay(d)
        };
      }
    }

    const items = await Reservation.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)          // avoid returning thousands
      .lean();

    return res.json(items);
  } catch (err) {
    console.error('[ADMIN RESERVATIONS ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
