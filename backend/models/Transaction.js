const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  personName: {
    type: String,
    required: [true, 'Person name is required'],
    trim: true,
    maxlength: [100, 'Person name too long'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0'],
  },
  type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: {
      values: ['credit', 'debit'],
      message: 'Type must be credit or debit',
    },
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: {
      values: ['phonepe', 'googlepay', 'cash', 'bank_transfer', 'other'],
      message: 'Invalid payment method',
    },
  },
  purpose: {
    type: String,
    required: [true, 'Purpose is required'],
    trim: true,
    maxlength: [200, 'Purpose too long'],
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes too long'],
    default: '',
  },
  transactionDate: {
    type: Date,
    required: [true, 'Transaction date is required'],
    default: Date.now,
  },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for fast queries
transactionSchema.index({ userId: 1, transactionDate: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, personName: 'text', purpose: 'text', notes: 'text' });

module.exports = mongoose.model('Transaction', transactionSchema);
