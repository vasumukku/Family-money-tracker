import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TransactionHistory from './pages/TransactionHistory';
import AddTransaction from './pages/AddTransaction';
import EditTransaction from './pages/EditTransaction';
import Settings from './pages/Settings';
import FamilyMembers from './pages/FamilyMembers';
import Layout from './components/Layout';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useApp();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useApp();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useApp();
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

const AppRoutes = () => {
  const { theme } = useApp();
  return (
    <>
      <Toaster position="top-center" toastOptions={{
        duration: 3000,
        style: { background: theme === 'dark' ? '#1f2937' : '#fff', color: theme === 'dark' ? '#f3f4f6' : '#111827', border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`, borderRadius: '12px', padding: '14px 18px', fontSize: '15px', fontWeight: '500' },
        success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
        error: { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
      }} />
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<TransactionHistory />} />
          <Route path="add" element={<AdminRoute><AddTransaction /></AdminRoute>} />
          <Route path="edit/:id" element={<AdminRoute><EditTransaction /></AdminRoute>} />
          <Route path="family" element={<AdminRoute><FamilyMembers /></AdminRoute>} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const App = () => (
  <AppProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AppProvider>
);

export default App;
