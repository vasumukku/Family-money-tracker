const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });

// Login
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
  try {
    const user = await User.findOne({ username: req.body.username.toLowerCase().trim() });
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Invalid username or password' });
    const isMatch = await user.comparePassword(req.body.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid username or password' });
    res.json({
      success: true,
      token: generateToken(user._id),
      user: { id: user._id, username: user.username, name: user.name, role: user.role, language: user.language, theme: user.theme },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// Get me
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: { id: req.user._id, username: req.user.username, name: req.user.name, role: req.user.role, language: req.user.language, theme: req.user.theme } });
});

// Update preferences
router.put('/update-preferences', protect, async (req, res) => {
  try {
    const { language, theme, name } = req.body;
    const updates = {};
    if (language && ['en', 'te'].includes(language)) updates.language = language;
    if (theme && ['light', 'dark'].includes(theme)) updates.theme = theme;
    if (name && name.trim()) updates.name = name.trim();
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json({ success: true, user: { id: user._id, username: user.username, name: user.name, role: user.role, language: user.language, theme: user.theme } });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// Update password (admin only)
router.put('/update-password', protect, adminOnly, [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 4 }).withMessage('New password must be at least 4 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
  try {
    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(req.body.currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    user.password = await bcrypt.hash(req.body.newPassword, 12);
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ── ADMIN ONLY: Manage family members ──

// Get all users
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// Create viewer account
router.post('/users', protect, adminOnly, [
  body('username').trim().notEmpty().isLength({ min: 3 }).withMessage('Username min 3 characters'),
  body('password').notEmpty().isLength({ min: 4 }).withMessage('Password min 4 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
  try {
    const existing = await User.findOne({ username: req.body.username.toLowerCase().trim() });
    if (existing) return res.status(400).json({ success: false, message: 'Username already exists' });
    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    const user = await User.create({
      username: req.body.username.toLowerCase().trim(),
      password: hashedPassword,
      name: req.body.name.trim(),
      role: 'viewer', // always viewer - admin cannot create another admin
    });
    res.status(201).json({ success: true, user: { id: user._id, username: user.username, name: user.name, role: user.role } });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// Update viewer
router.put('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, isActive, password } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (password && password.length >= 4) updates.password = await bcrypt.hash(password, 12);
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// Delete viewer
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;
