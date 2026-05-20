import React from 'react';
import { MdAdd } from 'react-icons/md';
import { useT } from '../context/AppContext';
import TransactionForm from '../components/TransactionForm';

const AddTransaction = () => {
  const t = useT();
  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title flex items-center gap-2">
          <MdAdd className="text-blue-600 dark:text-blue-400" />
          {t.addTransaction}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t.appTagline}
        </p>
      </div>
      <div className="card p-5">
        <TransactionForm />
      </div>
    </div>
  );
};

export default AddTransaction;
