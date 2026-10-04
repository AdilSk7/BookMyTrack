const mongoose = require('mongoose');

const trainSchema = new mongoose.Schema({
  trainNo: {
    type: String,
    required: true,
    unique: true
  },
  trainName: {
    type: String,
    required: true
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  departure: {
    type: String,
    required: true
  },
  arrival: {
    type: String,
    required: true
  },
  baseFare: {
    type: Number,
    required: true,
    default: 449
  },
  status: {
    type: String,
    enum: ['On Time', 'Delayed', 'Cancelled'],
    default: 'On Time'
  },
  classes: {
    type: [String],
    default: ["SL"]
  },
  classFares: {
    type: Map,
    of: Number,
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('Train', trainSchema);
