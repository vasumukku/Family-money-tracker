import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MdEdit, MdDelete, MdArrowBack } from 'react-icons/md';
import { api, useT } from '../context/AppContext';
import TransactionForm from '../components/TransactionForm';

const EditTransaction = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const t = useT();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/transactions/${id}`);
        if (data.success) setTransaction(data.transaction);
      } catch {
        toast.error('Transaction not found');
        navigate('/transactions');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/transactions/${id}`);
      toast.success(t.transactionDeleted);
      navigate('/transactions');
    } catch {
      toast.error('Failed to delete');
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="spinner w-10 h-10 border-4" />
    </div>
  );

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <MdEdit className="text-blue-600 dark:text-blue-400" />
            Edit Transaction
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{transaction?.personName}</p>
        </div>
        <button onClick={() => setShowConfirm(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl font-semibold text-sm hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all">
          <MdDelete className="text-lg" /> {t.delete}
        </button>
      </div>

      <div className="card p-5">
        <TransactionForm transaction={transaction} onSuccess={() => navigate('/transactions')} />
      </div>

      {/* Delete confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-sm shadow-2xl animate-scale-in">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MdDelete className="text-rose-500 text-3xl" />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">Delete Transaction?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">{t.confirmDelete}</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowConfirm(false)} className="btn-secondary">{t.no}</button>
              <button onClick={handleDelete} disabled={deleting} className="btn-danger">
                {deleting ? <><span className="spinner scale-75" />Deleting...</> : <><MdDelete />{t.yes}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditTransaction;
