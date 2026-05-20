const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');
const XLSX = require('xlsx');

// All routes protected
router.use(protect);

// Validation rules
const transactionValidation = [
  body('personName').trim().notEmpty().withMessage('Person name is required').isLength({ max: 100 }),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('type').isIn(['credit', 'debit']).withMessage('Type must be credit or debit'),
  body('paymentMethod').isIn(['phonepe', 'googlepay', 'cash', 'bank_transfer', 'other']).withMessage('Invalid payment method'),
  body('purpose').trim().notEmpty().withMessage('Purpose is required').isLength({ max: 200 }),
  body('notes').optional().trim().isLength({ max: 500 }),
  body('transactionDate').optional().isISO8601().withMessage('Invalid date format'),
];

// @route   GET /api/transactions
// @desc    Get all transactions with filter/sort/search
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { 
      search, type, paymentMethod, 
      startDate, endDate, personName,
      sortBy = 'transactionDate', sortOrder = 'desc',
      page = 1, limit = 50 
    } = req.query;

    const query = { userId: req.user._id };

    // Search
    if (search) {
      query.$or = [
        { personName: { $regex: search, $options: 'i' } },
        { purpose: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    // Filters
    if (type && ['credit', 'debit'].includes(type)) query.type = type;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (personName) query.personName = { $regex: personName, $options: 'i' };

    // Date range
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) query.transactionDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.transactionDate.$lte = end;
      }
    }

    // Sort
    const sortOptions = {};
    const validSortFields = ['transactionDate', 'amount', 'personName', 'createdAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'transactionDate';
    sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 200);
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort(sortOptions).skip(skip).limit(limitNum),
      Transaction.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: transactions.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      transactions,
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/transactions/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;

    // Overall totals
    const totals = await Transaction.aggregate([
      { $match: { userId } },
      { $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      }},
    ]);

    let totalCredit = 0, totalDebit = 0, creditCount = 0, debitCount = 0;
    totals.forEach(t => {
      if (t._id === 'credit') { totalCredit = t.total; creditCount = t.count; }
      if (t._id === 'debit') { totalDebit = t.total; debitCount = t.count; }
    });

    // Monthly data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyData = await Transaction.aggregate([
      { $match: { userId, transactionDate: { $gte: sixMonthsAgo } } },
      { $group: {
        _id: { 
          year: { $year: '$transactionDate' }, 
          month: { $month: '$transactionDate' },
          type: '$type',
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Current month stats
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const currentMonthTotals = await Transaction.aggregate([
      { $match: { userId, transactionDate: { $gte: monthStart } } },
      { $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      }},
    ]);

    let monthCredit = 0, monthDebit = 0;
    currentMonthTotals.forEach(t => {
      if (t._id === 'credit') monthCredit = t.total;
      if (t._id === 'debit') monthDebit = t.total;
    });

    // Recent transactions (last 10)
    const recentTransactions = await Transaction.find({ userId })
      .sort({ transactionDate: -1 })
      .limit(10);

    // Top persons
    const topPersons = await Transaction.aggregate([
      { $match: { userId } },
      { $group: {
        _id: '$personName',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        lastTransaction: { $max: '$transactionDate' },
      }},
      { $sort: { totalAmount: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      stats: {
        totalBalance: totalCredit - totalDebit,
        totalCredit,
        totalDebit,
        creditCount,
        debitCount,
        totalTransactions: creditCount + debitCount,
        monthCredit,
        monthDebit,
        monthBalance: monthCredit - monthDebit,
        monthlyData,
        recentTransactions,
        topPersons,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/transactions
// @desc    Add transaction
// @access  Private
router.post('/', transactionValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  try {
    const { personName, amount, type, paymentMethod, purpose, notes, transactionDate } = req.body;

    const transaction = await Transaction.create({
      userId: req.user._id,
      personName: personName.trim(),
      amount: parseFloat(amount),
      type,
      paymentMethod,
      purpose: purpose.trim(),
      notes: notes ? notes.trim() : '',
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
    });

    res.status(201).json({ success: true, transaction });
  } catch (error) {
    console.error('Add transaction error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update transaction
// @access  Private
router.put('/:id', transactionValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const { personName, amount, type, paymentMethod, purpose, notes, transactionDate } = req.body;

    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      {
        personName: personName.trim(),
        amount: parseFloat(amount),
        type,
        paymentMethod,
        purpose: purpose.trim(),
        notes: notes ? notes.trim() : '',
        transactionDate: transactionDate ? new Date(transactionDate) : transaction.transactionDate,
      },
      { new: true, runValidators: true }
    );

    res.json({ success: true, transaction: updated });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete transaction
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/transactions/export/excel
// @desc    Export transactions to Excel
// @access  Private
router.get('/export/excel', async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ transactionDate: -1 });

    const data = transactions.map((t, i) => ({
      'S.No': i + 1,
      'Date': new Date(t.transactionDate).toLocaleDateString('en-IN'),
      'Person Name': t.personName,
      'Type': t.type === 'credit' ? 'Credit (Received)' : 'Debit (Sent)',
      'Amount (₹)': t.amount,
      'Payment Method': t.paymentMethod.replace('_', ' ').toUpperCase(),
      'Purpose': t.purpose,
      'Notes': t.notes || '',
      'Added On': new Date(t.createdAt).toLocaleDateString('en-IN'),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

    // Summary sheet
    const allStats = await Transaction.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    let credit = 0, debit = 0;
    allStats.forEach(s => { if (s._id === 'credit') credit = s.total; else debit = s.total; });

    const summary = [
      { 'Summary': 'Total Credit (Received)', 'Amount (₹)': credit },
      { 'Summary': 'Total Debit (Sent)', 'Amount (₹)': debit },
      { 'Summary': 'Net Balance', 'Amount (₹)': credit - debit },
      { 'Summary': 'Total Transactions', 'Amount (₹)': transactions.length },
    ];
    const ws2 = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, ws2, 'Summary');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=FamilyMoneyTracker_${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

// @route   GET /api/transactions/:id
// @desc    Get single transaction
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    res.json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
