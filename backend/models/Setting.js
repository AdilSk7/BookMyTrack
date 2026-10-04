// backend/models/Setting.js
const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  description: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model('Setting', SettingSchema);
