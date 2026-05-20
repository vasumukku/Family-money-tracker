const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [4, 'Password must be at least 4 characters'],
  },
  name: {
    type: String,
    default: 'Family Member',
    trim: true,
  },
  role: {
    type: String,
    enum: ['admin', 'viewer'],
    default: 'viewer',
  },
  language: { type: String, enum: ['en', 'te'], default: 'en' },
  theme: { type: String, enum: ['light', 'dark'], default: 'light' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
