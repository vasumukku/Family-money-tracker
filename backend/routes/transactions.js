const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const { protect, adminOnly } = require('../middleware/auth');
const XLSX = require('xlsx');

router.use(protect);

const transactionValidation = [
  body('personName').trim().notEmpty().withMessage('Person name is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('type').isIn(['credit', 'debit']).withMessage('Type must be credit or debit'),
  body('paymentMethod').isIn(['phonepe', 'googlepay', 'cash', 'bank_transfer', 'other']),
  body('purpose').trim().notEmpty().withMessage('Purpose is required'),
];

// Helper - get admin userId (viewers see admin's transactions)
const getOwnerId = async (user) => {
  if (user.role === 'admin') return user._id;
  const admin = await require('../models/User').findOne({ role: 'admin' });
  return admin ? admin._id : user._id;
};

// GET all - both can view
router.get('/', async (req, res) => {
  try {
    const userId = await getOwnerId(req.user);
    const { search, type, paymentMethod, startDate, endDate, sortBy = 'transactionDate', sortOrder = 'desc', page = 1, limit = 50 } = req.query;
    const query = { userId };
    if (search) query.$or = [{ personName: { $regex: search, $options: 'i' } }, { purpose: { $regex: search, $options: 'i' } }, { notes: { $regex: search, $options: 'i' } }];
    if (type) query.type = type;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) query.transactionDate.$gte = new Date(startDate);
      if (endDate) { const end = new Date(endDate); end.setHours(23,59,59,999); query.transactionDate.$lte = end; }
    }
    const sortOptions = {};
    sortOptions[['transactionDate','amount','personName','createdAt'].includes(sortBy) ? sortBy : 'transactionDate'] = sortOrder === 'asc' ? 1 : -1;
    const pageNum = parseInt(page), limitNum = Math.min(parseInt(limit), 200);
    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort(sortOptions).skip((pageNum-1)*limitNum).limit(limitNum),
      Transaction.countDocuments(query),
    ]);
    res.json({ success: true, count: transactions.length, total, page: pageNum, pages: Math.ceil(total/limitNum), transactions });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// GET stats - both can view
router.get('/stats', async (req, res) => {
  try {
    const userId = await getOwnerId(req.user);
    const totals = await Transaction.aggregate([
      { $match: { userId } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);
    let totalCredit = 0, totalDebit = 0, creditCount = 0, debitCount = 0;
    totals.forEach(t => { if (t._id === 'credit') { totalCredit = t.total; creditCount = t.count; } else { totalDebit = t.total; debitCount = t.count; } });

    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth()-5); sixMonthsAgo.setDate(1); sixMonthsAgo.setHours(0,0,0,0);
    const monthlyData = await Transaction.aggregate([
      { $match: { userId, transactionDate: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$transactionDate' }, month: { $month: '$transactionDate' }, type: '$type' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
    const currentMonthTotals = await Transaction.aggregate([
      { $match: { userId, transactionDate: { $gte: monthStart } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);
    let monthCredit = 0, monthDebit = 0;
    currentMonthTotals.forEach(t => { if (t._id === 'credit') monthCredit = t.total; else monthDebit = t.total; });
    const recentTransactions = await Transaction.find({ userId }).sort({ transactionDate: -1 }).limit(10);
    res.json({ success: true, stats: { totalBalance: totalCredit-totalDebit, totalCredit, totalDebit, creditCount, debitCount, totalTransactions: creditCount+debitCount, monthCredit, monthDebit, monthBalance: monthCredit-monthDebit, monthlyData, recentTransactions } });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// POST - admin only
router.post('/', adminOnly, transactionValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
  try {
    const { personName, amount, type, paymentMethod, purpose, notes, transactionDate } = req.body;
    const transaction = await Transaction.create({ userId: req.user._id, personName: personName.trim(), amount: parseFloat(amount), type, paymentMethod, purpose: purpose.trim(), notes: notes?.trim() || '', transactionDate: transactionDate ? new Date(transactionDate) : new Date() });
    res.status(201).json({ success: true, transaction });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// PUT - admin only
router.put('/:id', adminOnly, transactionValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    const { personName, amount, type, paymentMethod, purpose, notes, transactionDate } = req.body;
    const updated = await Transaction.findByIdAndUpdate(req.params.id, { personName: personName.trim(), amount: parseFloat(amount), type, paymentMethod, purpose: purpose.trim(), notes: notes?.trim() || '', transactionDate: transactionDate ? new Date(transactionDate) : transaction.transactionDate }, { new: true });
    res.json({ success: true, transaction: updated });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// DELETE - admin only
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, message: 'Transaction deleted' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// Export - both can export
router.get('/export/excel', async (req, res) => {
  try {
    const userId = await getOwnerId(req.user);
    const transactions = await Transaction.find({ userId }).sort({ transactionDate: -1 });
    const data = transactions.map((t, i) => ({ 'S.No': i+1, 'Date': new Date(t.transactionDate).toLocaleDateString('en-IN'), 'Person Name': t.personName, 'Type': t.type === 'credit' ? 'Credit (Received)' : 'Debit (Sent)', 'Amount (₹)': t.amount, 'Payment Method': t.paymentMethod.replace('_',' ').toUpperCase(), 'Purpose': t.purpose, 'Notes': t.notes || '' }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=FamilyMoneyTracker_${Date.now()}.xlsx`);
    res.send(buffer);
  } catch { res.status(500).json({ success: false, message: 'Export failed' }); }
});

// GET single - both can view
router.get('/:id', async (req, res) => {
  try {
    const userId = await getOwnerId(req.user);
    const transaction = await Transaction.findOne({ _id: req.params.id, userId });
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, transaction });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;
