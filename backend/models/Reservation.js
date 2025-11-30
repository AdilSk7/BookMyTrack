// models/Reservation.js
const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema({
  name: String,
  age: Number,
  gender: String,

  // Preferences & allocation
  berthPreference: String,          // user requested
  berthAllocated: String,           // computed/allotted

  // Accessibility flags
  accessible: Boolean,
  needsWheelchair: { type: Boolean, default: false },
  needsPrioritySeat: { type: Boolean, default: false },

  // Grouping / companion logic
  companionOf: { type: Number, default: null }, // index of passenger they accompany
  groupId:     { type: String, default: null }, // same group => sit together

  // ⭐ NEW PRIORITY FIELDS (required for elderly/wheelchair smart allocation)
  priorityScore: { type: Number, default: 0 },  // computed during /book
  originalIdx:   { type: Number, default: 0 },  // original position in passenger list

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
  accessible:      { type: Boolean, default: false }, // global accessibility switch

  // Passenger list containing all derived priority + seat metadata
  passengers: { type: [passengerSchema], default: [] },

  // Booking identifiers & state
  pnr:    { type: String, required: true, unique: true },
  status: { type: String, enum: ['Pending','Confirmed','Cancelled','Paid'], default: 'Confirmed' },

  // ===== Fare fields =====
  fareTotal: { type: Number, default: 0 },     // total fare in INR
  farePerPax:{ type: [Number], default: [] },  // aligned list with passengers[]
  currency:  { type: String,  default: 'INR' }
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);
