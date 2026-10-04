// backend/routes/Admin.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const Feedback = require('../models/Feedback');
const Contact = require('../models/Contact');
const User = require('../models/User');
const Train = require('../models/Train');
const Setting = require('../models/Setting');

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
    const totalUsers = await User.countDocuments();

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
      todayBookings,
      totalUsers
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
    if (userId) {
      if (mongoose.Types.ObjectId.isValid(userId)) {
         filter.userId = userId.trim();
      } else {
         // Could search by name if we joined, but simple fallback
      }
    }
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
      .populate('userId', 'name') // POPULATE USER ACCOUNT NAME
      .sort({ createdAt: -1 })
      .limit(200)          // avoid returning thousands
      .lean();

    return res.json(items);
  } catch (err) {
    console.error('[ADMIN RESERVATIONS ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/reservations/:id', async (req, res) => {
  try {
    const deleted = await Reservation.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Reservation not found' });
    return res.json({ success: true, pnr: deleted.pnr });
  } catch (err) {
    console.error('[ADMIN DELETE RESV ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});

router.put('/reservations/:id', async (req, res) => {
  try {
    const { status, paxIndex, paxName, paxAge, paxCoach, paxSeat } = req.body;
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

    // Update global status
    if (status) {
       reservation.status = status;
    }

    // Update specific passenger if an index was passed
    if (paxIndex !== undefined && paxIndex >= 0 && paxIndex < reservation.passengers.length) {
       if (paxName !== undefined) reservation.passengers[paxIndex].name = paxName;
       if (paxAge !== undefined) reservation.passengers[paxIndex].age = paxAge;
       if (paxCoach !== undefined) reservation.passengers[paxIndex].coach = paxCoach;
       if (paxSeat !== undefined) reservation.passengers[paxIndex].seatLabel = paxSeat;
    }

    await reservation.save();
    return res.json({ success: true, reservation });
  } catch (err) {
    console.error('[ADMIN EDIT RESV ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});


router.get('/feedback', async (req, res) => {
  try {
    const items = await Feedback.find().sort({ createdAt: -1 }).lean();
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/feedback/:id', async (req, res) => {
  try {
    const fb = await Feedback.findByIdAndDelete(req.params.id);
    if (!fb) return res.status(404).json({ error: 'Feedback not found' });
    return res.json({ message: 'Feedback deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/contact', async (req, res) => {
  try {
    const items = await Contact.find().sort({ createdAt: -1 }).lean();
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/contact/:id/reply', async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply) return res.status(400).json({ error: 'Reply text required' });
    
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { reply },
      { new: true }
    );
    if (!contact) return res.status(404).json({ error: 'Contact query not found' });
    return res.json({ success: true, contact });
  } catch (err) {
    console.error('[ADMIN CONTACT REPLY ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    console.error('[ADMIN DELETE USER ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});

// =======================
// TRAINS CRUD
// =======================
router.get('/trains', async (req, res) => {
  try {
    const trains = await Train.find().sort({ trainNo: 1 }).lean();
    return res.json(trains);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/trains', async (req, res) => {
  try {
    const newTrain = new Train(req.body);
    await newTrain.save();
    return res.json({ success: true, train: newTrain });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/trains/:id', async (req, res) => {
  try {
    const updated = await Train.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.json({ success: true, train: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/trains/:id', async (req, res) => {
  try {
    await Train.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// =======================
// SETTINGS
// =======================
router.get('/settings', async (req, res) => {
  try {
    const settings = await Setting.find().lean();
    // Convert array to object { key: value } for frontend ease
    const settingsMap = {};
    settings.forEach(s => settingsMap[s.key] = s.value);
    return res.json(settingsMap);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/settings', async (req, res) => {
  try {
    // req.body should be an object representing key-value updates
    // e.g. { maintenance_mode: true, global_announcement: "Hello" }
    const updates = req.body;
    
    // Batch upsert them
    const promises = Object.keys(updates).map(async (k) => {
        return await Setting.findOneAndUpdate(
            { key: k }, 
            { value: updates[k] }, 
            { upsert: true, new: true }
        );
    });
    
    await Promise.all(promises);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
