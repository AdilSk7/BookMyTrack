// routes/payment.js
const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Reservation = require('../models/Reservation'); // ✅ needed to update reservation

router.post('/pay', async (req, res) => {
  try {
    const { userId, reservationId, pnr, amount, method = 'card', cardNumber, upi } = req.body;

    if (!userId) return res.status(400).json({ error: 'userId is required' });
    if (!pnr) return res.status(400).json({ error: 'pnr is required' });
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const cardLast4 = cardNumber ? String(cardNumber).slice(-4) : undefined;

    const payment = new Payment({
      userId,
      reservationId: reservationId || undefined,
      pnr,
      amount: Number(amount),
      method,
      cardLast4,
      upi
    });

    await payment.save();

    // ✅ After payment, confirm reservation status
    if (reservationId) {
      await Reservation.findByIdAndUpdate(reservationId, { status: 'Paid' });
    }

    return res.status(201).json({
      message: 'Payment recorded',
      payment
    });
  } catch (err) {
    console.error('[PAYMENT ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
