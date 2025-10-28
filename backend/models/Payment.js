// Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', required: false },
  pnr: { type: String, required: true },
  method: { type: String, enum: ['card', 'upi', 'wallet'], default: 'card' },
  cardLast4: { type: String },
  upi: { type: String },
  amount: { type: Number, required: true },
  status: { type: String, default: 'Paid' },
  paymentDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
