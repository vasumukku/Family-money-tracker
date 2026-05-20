import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { MdSearch, MdFilterList, MdEdit, MdDelete, MdDownload, MdClose, MdHistory } from 'react-icons/md';
import { api, useApp, useT } from '../context/AppContext';

const PAYMENT_ICONS = { phonepe:'📱', googlepay:'💳', cash:'💵', bank_transfer:'🏦', other:'💰' };
const PAYMENT_LABELS = { phonepe:'PhonePe', googlepay:'GPay', cash:'Cash', bank_transfer:'Bank', other:'Other' };

const TransactionHistory = () => {
  const { user } = useApp();
  const isAdmin = user?.role === 'admin';
  const t = useT();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({ search:'', type:'', paymentMethod:'', sortBy:'transactionDate', sortOrder:'desc', startDate:'', endDate:'' });

  const fetchTransactions = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: 20, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await api.get('/transactions', { params });
      if (data.success) { setTransactions(data.transactions); setTotal(data.total); setTotalPages(data.pages); setPage(pg); }
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchTransactions(1); }, [filters]);

  const handleDelete = async () => {
    try {
      await api.delete(`/transactions/${deleteId}`);
      toast.success(t.transactionDeleted);
      setDeleteId(null);
      fetchTransactions(page);
    } catch { toast.error('Failed to delete'); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/transactions/export/excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url;
      a.download = `FamilyMoneyTracker_${format(new Date(),'yyyy-MM-dd')}.xlsx`;
      a.click(); window.URL.revokeObjectURL(url);
      toast.success('Excel downloaded!');
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const updateFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));
  const clearFilters = () => setFilters({ search:'', type:'', paymentMethod:'', sortBy:'transactionDate', sortOrder:'desc', startDate:'', endDate:'' });
  const hasActiveFilters = filters.search || filters.type || filters.paymentMethod || filters.startDate || filters.endDate;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2"><MdHistory className="text-blue-600 dark:text-blue-400" />{t.allTransactions}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{total} transactions total</p>
        </div>
        <button onClick={handleExport} disabled={exporting}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl font-semibold text-sm hover:bg-emerald-100 transition-all disabled:opacity-60">
          <MdDownload className="text-lg" />
          <span className="hidden sm:inline">{exporting ? 'Exporting...' : t.export}</span>
        </button>
      </div>

      {/* Search + Filter */}
      <div className="card p-3 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            <input type="text" className="input pl-10 py-3" placeholder={t.search}
              value={filters.search} onChange={e => updateFilter('search', e.target.value)} />
            {filters.search && <button onClick={() => updateFilter('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><MdClose className="text-lg" /></button>}
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${showFilters || hasActiveFilters ? 'bg-blue-600 text-white' : 'btn-secondary'}`}>
            <MdFilterList className="text-lg" />
            <span className="hidden sm:inline">{t.filter}</span>
            {hasActiveFilters && <span className="w-2 h-2 bg-yellow-400 rounded-full" />}
          </button>
        </div>
        {showFilters && (
          <div className="border-t border-gray-100 dark:border-gray-800 pt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            <select className="input py-2.5 text-sm" value={filters.type} onChange={e => updateFilter('type', e.target.value)}>
              <option value="">{t.filterAll}</option>
              <option value="credit">{t.filterCredit}</option>
              <option value="debit">{t.filterDebit}</option>
            </select>
            <select className="input py-2.5 text-sm" value={filters.paymentMethod} onChange={e => updateFilter('paymentMethod', e.target.value)}>
              <option value="">All Methods</option>
              <option value="phonepe">PhonePe</option>
              <option value="googlepay">Google Pay</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
            <select className="input py-2.5 text-sm" value={`${filters.sortBy}_${filters.sortOrder}`}
              onChange={e => { const [sb,so] = e.target.value.split('_'); updateFilter('sortBy',sb); updateFilter('sortOrder',so); }}>
              <option value="transactionDate_desc">{t.sortLatest}</option>
              <option value="transactionDate_asc">{t.sortOldest}</option>
              <option value="amount_desc">{t.sortHighest}</option>
              <option value="amount_asc">{t.sortLowest}</option>
            </select>
            <input type="date" className="input py-2.5 text-sm" value={filters.startDate} onChange={e => updateFilter('startDate', e.target.value)} />
            <input type="date" className="input py-2.5 text-sm" value={filters.endDate} onChange={e => updateFilter('endDate', e.target.value)} />
            {hasActiveFilters && <button onClick={clearFilters} className="flex items-center justify-center gap-1 py-2.5 text-sm text-rose-500 font-semibold hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl"><MdClose /> Clear</button>}
          </div>
        )}
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="spinner w-10 h-10 border-4" /></div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 px-4">
            <MdHistory className="text-3xl text-gray-400 mx-auto mb-3" />
            <p className="font-semibold text-gray-500 dark:text-gray-400">{t.noResults}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {transactions.map(txn => (
              <div key={txn._id} className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl ${txn.type === 'credit' ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-rose-50 dark:bg-rose-900/30'}`}>
                  {PAYMENT_ICONS[txn.paymentMethod]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate text-sm">{txn.personName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{txn.purpose}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="badge-payment">{PAYMENT_LABELS[txn.paymentMethod]}</span>
                        <span className={txn.type === 'credit' ? 'badge-credit' : 'badge-debit'}>{txn.type === 'credit' ? '↓' : '↑'} {txn.type}</span>
                        <span className="text-xs text-gray-400">{format(new Date(txn.transactionDate), 'dd MMM yyyy')}</span>
                      </div>
                      {txn.notes && <p className="text-xs text-gray-400 italic mt-0.5 truncate">{txn.notes}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <p className={`font-bold text-base ${txn.type === 'credit' ? 'amount-credit' : 'amount-debit'}`}>
                        {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                      </p>
                      {/* Only show edit/delete for admin */}
                      {isAdmin && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link to={`/edit/${txn._id}`} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"><MdEdit className="text-lg" /></Link>
                          <button onClick={() => setDeleteId(txn._id)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"><MdDelete className="text-lg" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-800">
            <button disabled={page<=1} onClick={() => fetchTransactions(page-1)} className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">← Prev</button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button disabled={page>=totalPages} onClick={() => fetchTransactions(page+1)} className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">Next →</button>
          </div>
        )}
      </div>

      {/* Delete confirm - admin only */}
      {deleteId && isAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-sm shadow-2xl">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MdDelete className="text-rose-500 text-3xl" />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">Delete Transaction?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">{t.confirmDelete}</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary">{t.no}</button>
              <button onClick={handleDelete} className="btn-danger"><MdDelete />{t.yes}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
