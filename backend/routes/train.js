const express = require('express');
const router = express.Router();
const Train = require('../models/Train');

// GET all trains
router.get('/', async (req, res) => {
  try {
    const trains = await Train.find().sort({ trainNo: 1 });
    res.json(trains);
  } catch (err) {
    console.error('[TRAIN GET ALL ERROR]', err);
    res.status(500).json({ error: 'Server error retrieving schedules' });
  }
});

module.exports = router;
