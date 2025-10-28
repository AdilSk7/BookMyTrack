// backend/routes/profile.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET profile (no password)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    console.error('[profile get]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
