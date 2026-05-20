import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  MdTrendingUp, MdTrendingDown, MdAccountBalance, MdAdd,
  MdArrowUpward, MdArrowDownward, MdRefresh,
} from 'react-icons/md';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { api, useApp, useT } from '../context/AppContext';

const formatAmount = (n) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
};

const formatFull = (n) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PAYMENT_ICONS = {
  phonepe: '📱', googlepay: '💳', cash: '💵', bank_transfer: '🏦', other: '💰',
};

const PAYMENT_LABELS = {
  phonepe: 'PhonePe', googlepay: 'GPay', cash: 'Cash', bank_transfer: 'Bank', other: 'Other',
};

const Dashboard = () => {
  const { theme } = useApp();
  const t = useT();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/transactions/stats');
      if (data.success) setStats(data.stats);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  // Build monthly chart data
  const buildChartData = () => {
    if (!stats?.monthlyData) return [];
    const monthMap = {};
    stats.monthlyData.forEach(d => {
      const key = `${d._id.year}-${String(d._id.month).padStart(2, '0')}`;
      if (!monthMap[key]) monthMap[key] = { month: t.months[d._id.month - 1], credit: 0, debit: 0 };
      if (d._id.type === 'credit') monthMap[key].credit = d.total;
      else monthMap[key].debit = d.total;
    });
    return Object.values(monthMap).slice(-6);
  };

  const chartData = buildChartData();
  const isDark = theme === 'dark';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="spinner w-10 h-10 border-4" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t.loading}</p>
      </div>
    );
  }

  const balance = stats?.totalBalance ?? 0;
  const isPositive = balance >= 0;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{t.dashboard}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {format(new Date(), 'dd MMM yyyy')}
          </p>
        </div>
        <button onClick={fetchStats} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-all active:scale-95">
          <MdRefresh className="text-xl" />
        </button>
      </div>

      {/* Balance Hero Card */}
      <div className={`rounded-2xl p-6 text-white relative overflow-hidden ${isPositive ? 'bg-gradient-to-br from-blue-600 to-blue-800' : 'bg-gradient-to-br from-rose-500 to-rose-700'}`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-8 -translate-x-6" />
        <div className="relative z-10">
          <p className="text-blue-100 text-sm font-medium mb-2 flex items-center gap-2">
            <MdAccountBalance className="text-lg" />
            {t.totalBalance}
          </p>
          <p className="text-4xl font-black tracking-tight mb-4">
            {balance < 0 ? '-' : ''}{formatFull(Math.abs(balance))}
          </p>
          <div className="flex gap-4">
            <div>
              <p className="text-blue-200 text-xs mb-0.5">{t.thisMonth}</p>
              <p className="text-white font-bold text-sm">
                ↑ {formatAmount(stats?.monthCredit || 0)} / ↓ {formatAmount(stats?.monthDebit || 0)}
              </p>
            </div>
            <div className="ml-auto">
              <p className="text-blue-200 text-xs mb-0.5">{t.transactions_count}</p>
              <p className="text-white font-bold text-sm">{stats?.totalTransactions || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <MdArrowDownward className="text-emerald-600 dark:text-emerald-400 text-xl" />
            </div>
            <span className="badge-credit">{t.credit.split(' ')[0]}</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t.totalCredit}</p>
            <p className="amount-credit text-xl">{formatAmount(stats?.totalCredit || 0)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stats?.creditCount || 0} {t.transactions_count}</p>
          </div>
        </div>

        <div className="stat-card border-l-4 border-rose-500">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/30 rounded-xl flex items-center justify-center">
              <MdArrowUpward className="text-rose-600 dark:text-rose-400 text-xl" />
            </div>
            <span className="badge-debit">{t.debit.split(' ')[0]}</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t.totalDebit}</p>
            <p className="amount-debit text-xl">{formatAmount(stats?.totalDebit || 0)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stats?.debitCount || 0} {t.transactions_count}</p>
          </div>
        </div>
      </div>

      {/* Monthly Chart */}
      {chartData.length > 0 && (
        <div className="card p-5">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4 text-base">{t.monthlySummary}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f3f4f6'} />
              <XAxis dataKey="month" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => formatAmount(v)} tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} width={55} />
              <Tooltip
                formatter={(val, name) => [formatFull(val), name === 'credit' ? t.received : t.sent]}
                contentStyle={{
                  background: isDark ? '#1f2937' : '#fff',
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: isDark ? '#f3f4f6' : '#111827',
                }}
              />
              <Bar dataKey="credit" name="credit" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="debit" name="debit" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />{t.received}</div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />{t.sent}</div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="card">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-white text-base">{t.recentTransactions}</h2>
          <Link to="/transactions" className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline">
            View all →
          </Link>
        </div>

        {!stats?.recentTransactions?.length ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <MdAccountBalance className="text-gray-400 text-3xl" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">{t.noTransactions}</p>
            <Link to="/add" className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              <MdAdd /> {t.addFirst}
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {stats.recentTransactions.map((txn) => (
              <Link key={txn._id} to={`/edit/${txn._id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                {/* Icon */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl
                  ${txn.type === 'credit' ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-rose-50 dark:bg-rose-900/30'}`}>
                  {PAYMENT_ICONS[txn.paymentMethod]}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate text-sm">{txn.personName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{txn.purpose}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="badge-payment">{PAYMENT_LABELS[txn.paymentMethod]}</span>
                    <span className="text-xs text-gray-400">{format(new Date(txn.transactionDate), 'dd MMM')}</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className={`font-bold text-base ${txn.type === 'credit' ? 'amount-credit' : 'amount-debit'}`}>
                    {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                  </p>
                  <p className={`text-xs font-semibold ${txn.type === 'credit' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {txn.type === 'credit' ? '↓ ' + (t.received) : '↑ ' + (t.sent)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Add FAB - desktop visible */}
      <div className="hidden lg:block">
        <Link
          to="/add"
          className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-blue-900/40 hover:shadow-xl transition-all hover:-translate-y-1 active:scale-95"
        >
          <MdAdd className="text-2xl" />
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
