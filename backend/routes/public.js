const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const Contact = require('../models/Contact');

router.post('/feedback', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'Missing fields' });
    const fb = new Feedback({ name, email, message });
    await fb.save();
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/contact', async (req, res) => {
  try {
    const { name, email, query, userId } = req.body;
    if (!name || !email || !query) return res.status(400).json({ error: 'Missing fields' });
    const contact = new Contact({ name, email, query, userId: userId || null });
    await contact.save();
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Fetch all queries for a specific user to display in their Support Inbox
router.get('/contact/user/:userId', async (req, res) => {
  try {
    const items = await Contact.find({ userId: req.params.userId }).sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
