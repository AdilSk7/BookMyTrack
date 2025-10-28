// backend/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  email:   { type: String, required: true, unique: true, index: true },
  password:{ type: String, required: true },
  age:     { type: Number, default: 0 },
  gender:  { type: String, enum: ['male','female','other'], default: 'other' },
  role:    { type: String, default: 'user' },
  photo:   { type: String, default: '' }   // kept for future use (optional)
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
