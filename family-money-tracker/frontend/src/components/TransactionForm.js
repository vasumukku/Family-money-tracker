import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  MdPerson, MdAttachMoney, MdCategory, MdCalendarToday,
  MdNotes, MdSave, MdArrowBack, MdArrowDownward, MdArrowUpward,
} from 'react-icons/md';
import { api, useT } from '../context/AppContext';

const PAYMENT_OPTIONS = [
  { value: 'phonepe', label: 'PhonePe', emoji: '📱' },
  { value: 'googlepay', label: 'Google Pay', emoji: '💳' },
  { value: 'cash', label: 'Cash', emoji: '💵' },
  { value: 'bank_transfer', label: 'Bank Transfer', emoji: '🏦' },
  { value: 'other', label: 'Other', emoji: '💰' },
];

const DEFAULT_FORM = {
  personName: '',
  amount: '',
  type: 'credit',
  paymentMethod: 'cash',
  purpose: '',
  notes: '',
  transactionDate: format(new Date(), 'yyyy-MM-dd'),
};

const TransactionForm = ({ transaction = null, onSuccess }) => {
  const t = useT();
  const navigate = useNavigate();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (transaction) {
      setForm({
        personName: transaction.personName || '',
        amount: transaction.amount?.toString() || '',
        type: transaction.type || 'credit',
        paymentMethod: transaction.paymentMethod || 'cash',
        purpose: transaction.purpose || '',
        notes: transaction.notes || '',
        transactionDate: transaction.transactionDate
          ? format(new Date(transaction.transactionDate), 'yyyy-MM-dd')
          : format(new Date(), 'yyyy-MM-dd'),
      });
    }
  }, [transaction]);

  const validate = () => {
    const errs = {};
    if (!form.personName.trim()) errs.personName = t.nameRequired;
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) errs.amount = t.amountRequired;
    if (!form.purpose.trim()) errs.purpose = t.purposeRequired;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast.error('Please fill all required fields'); return; }
    setSaving(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (transaction?._id) {
        await api.put(`/transactions/${transaction._id}`, payload);
        toast.success(t.transactionUpdated);
      } else {
        await api.post('/transactions', payload);
        toast.success(t.transactionAdded);
        setForm(DEFAULT_FORM);
      }
      if (onSuccess) onSuccess();
      else navigate('/transactions');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto">
      {/* Type selector */}
      <div>
        <label className="label">{t.type}</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { val: 'credit', icon: MdArrowDownward, colorOn: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', iconColor: 'text-emerald-500', label: t.credit, sub: t.received },
            { val: 'debit', icon: MdArrowUpward, colorOn: 'border-rose-500 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400', iconColor: 'text-rose-500', label: t.debit, sub: t.sent },
          ].map(({ val, icon: Icon, colorOn, iconColor, label, sub }) => (
            <button key={val} type="button" onClick={() => handleChange('type', val)}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 font-semibold text-sm
                ${form.type === val ? colorOn : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'}`}>
              <Icon className={`text-2xl ${form.type === val ? iconColor : 'text-gray-400'}`} />
              <span>{label}</span>
              <span className="text-xs opacity-70">{sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Person Name */}
      <div>
        <label className="label"><MdPerson className="inline mr-1" />{t.personName} *</label>
        <input type="text" className={`input ${errors.personName ? 'border-rose-400 ring-1 ring-rose-400' : ''}`}
          placeholder="Basha, Father, అమ్మ, నాన్న..."
          value={form.personName} onChange={e => handleChange('personName', e.target.value)} />
        {errors.personName && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.personName}</p>}
      </div>

      {/* Amount */}
      <div>
        <label className="label"><MdAttachMoney className="inline mr-1" />{t.amount} *</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-bold text-lg">₹</span>
          <input type="number" min="0.01" step="0.01"
            className={`input pl-8 text-xl font-bold ${errors.amount ? 'border-rose-400 ring-1 ring-rose-400' : ''}`}
            placeholder="0.00" value={form.amount} onChange={e => handleChange('amount', e.target.value)} />
        </div>
        {form.amount && !isNaN(form.amount) && parseFloat(form.amount) > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            ₹{parseFloat(form.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        )}
        {errors.amount && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.amount}</p>}
      </div>

      {/* Payment Method */}
      <div>
        <label className="label">{t.paymentMethod}</label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {PAYMENT_OPTIONS.map(opt => (
            <button key={opt.value} type="button" onClick={() => handleChange('paymentMethod', opt.value)}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all text-xs font-semibold
                ${form.paymentMethod === opt.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-blue-300'}`}>
              <span className="text-xl">{opt.emoji}</span>
              <span className="leading-tight text-center">{t[opt.value]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Purpose */}
      <div>
        <label className="label"><MdCategory className="inline mr-1" />{t.purpose} *</label>
        <input type="text" className={`input ${errors.purpose ? 'border-rose-400 ring-1 ring-rose-400' : ''}`}
          placeholder="Mobile Purchase, మొబైల్ కొనుగోలు, Loan..."
          value={form.purpose} onChange={e => handleChange('purpose', e.target.value)} />
        {errors.purpose && <p className="text-rose-500 text-xs mt-1 font-medium">{errors.purpose}</p>}
      </div>

      {/* Date */}
      <div>
        <label className="label"><MdCalendarToday className="inline mr-1" />{t.date}</label>
        <input type="date" className="input" value={form.transactionDate}
          max={format(new Date(), 'yyyy-MM-dd')}
          onChange={e => handleChange('transactionDate', e.target.value)} />
      </div>

      {/* Notes */}
      <div>
        <label className="label"><MdNotes className="inline mr-1" />{t.notes}</label>
        <textarea className="input resize-none" rows={3}
          placeholder="Additional notes... (optional)"
          value={form.notes} onChange={e => handleChange('notes', e.target.value)} />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">
          <MdArrowBack /> {t.cancel}
        </button>
        <button type="submit" disabled={saving}
          className={`flex-[2] ${form.type === 'credit' ? 'btn-success' : 'btn-danger'}`}>
          {saving
            ? <><span className="spinner scale-75" />{t.saving}</>
            : <><MdSave className="text-xl" />{transaction ? t.update : t.save}</>}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
