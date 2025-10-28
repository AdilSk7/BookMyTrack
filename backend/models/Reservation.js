// models/Reservation.js
const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema({
  name: String,
  age: Number,
  gender: String,

  // Preferences & allocation
  berthPreference: String,          // user requested
  berthAllocated: String,           // computed/allotted

  // Accessibility (legacy/global compatible)
  accessible: Boolean,
  needsWheelchair: { type: Boolean, default: false },
  needsPrioritySeat: { type: Boolean, default: false },

  // Grouping / companion logic
  companionOf: { type: Number, default: null }, // index of passenger they accompany
  groupId:     { type: String, default: null }, // same value => keep together

  // Assigned seat (after confirm-pay)
  coach:     { type: String, default: '' },
  seatNumber:{ type: Number, default: 0 },
  seatLabel: { type: String, default: '' }, // e.g. "S2-37"
}, { _id: false });

const reservationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  from:        { type: String, required: true },
  to:          { type: String, required: true },
  journeyDate: { type: Date,   required: true },

  berthPreference: { type: String,  default: '' },
  accessible:      { type: Boolean, default: false }, // global fallback

  passengers: { type: [passengerSchema], default: [] },

  // Booking identifiers & state
  pnr:    { type: String, required: true, unique: true },
  status: { type: String, enum: ['Pending','Confirmed','Cancelled','Paid'], default: 'Confirmed' },

  // ===== Fare fields (NEW) =====
  // Server-computed fare so UI can display consistent totals everywhere
  fareTotal: { type: Number, default: 0 },     // total fare for this reservation (INR)
  farePerPax:{ type: [Number], default: [] },  // aligned with passengers array
  currency:  { type: String,  default: 'INR' } // currency tag
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);
