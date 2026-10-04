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

// PUT update profile
router.put('/:id', async (req, res) => {
  try {
    const { name, age, gender, phone } = req.body;
    const user = await User.findByIdAndUpdate(
       req.params.id, 
       { name, age, gender, phone },
       { new: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    console.error('[profile update]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST append passenger
router.post('/:id/passengers', async (req, res) => {
  try {
    const { name, age, gender } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.savedPassengers.push({ name, age, gender });
    await user.save();
    
    return res.json(user.savedPassengers);
  } catch (err) {
    console.error('[profile add pax]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE remove passenger
router.delete('/:id/passengers/:index', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const idx = parseInt(req.params.index, 10);
    if (isNaN(idx) || idx < 0 || idx >= user.savedPassengers.length) {
       return res.status(400).json({ error: 'Invalid passenger index' });
    }
    
    user.savedPassengers.splice(idx, 1);
    await user.save();
    
    return res.json(user.savedPassengers);
  } catch (err) {
    console.error('[profile remove pax]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
