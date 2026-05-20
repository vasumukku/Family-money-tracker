import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MdAccountBalance, MdVisibility, MdVisibilityOff, MdLock, MdPerson } from 'react-icons/md';
import { useApp, useT } from '../context/AppContext';

const Login = () => {
  const { login, loading, language, setLanguage, theme, setTheme } = useApp();
  const t = useT();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.username.trim()) errs.username = t.nameRequired;
    if (!form.password) errs.password = t.amountRequired;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await login(form.username.trim(), form.password);
    if (result?.success) {
      toast.success('Welcome! 👋');
      navigate('/');
    } else {
      toast.error(result?.message || 'Login failed');
      setErrors({ password: result?.message });
    }
  };

  const isTE = language === 'te';

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950 flex items-center justify-center p-4 ${isTE ? 'font-te' : ''}`}>
      
      {/* Top-right controls */}
      <div className="fixed top-4 right-4 flex gap-2">
        <button
          onClick={() => setLanguage(language === 'en' ? 'te' : 'en')}
          className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow transition-all"
        >
          {language === 'en' ? 'తెలుగు' : 'English'}
        </button>
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow transition-all"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Card */}
        <div className="card p-8 shadow-xl shadow-blue-100 dark:shadow-none border border-blue-50 dark:border-gray-800">
          
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl items-center justify-center shadow-lg shadow-blue-200 dark:shadow-blue-900/30 mb-4">
              <MdAccountBalance className="text-white text-3xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{t.appName}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t.loginSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="label">{t.username}</label>
              <div className="relative">
                <MdPerson className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                <input
                  type="text"
                  className={`input pl-11 ${errors.username ? 'border-rose-400 dark:border-rose-600 ring-1 ring-rose-400' : ''}`}
                  placeholder={t.enterUsername}
                  value={form.username}
                  onChange={e => { setForm({ ...form, username: e.target.value }); setErrors({ ...errors, username: '' }); }}
                  autoComplete="username"
                  autoFocus
                />
              </div>
              {errors.username && <p className="text-rose-500 text-xs mt-1.5 font-medium">{errors.username}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="label">{t.password}</label>
              <div className="relative">
                <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`input pl-11 pr-12 ${errors.password ? 'border-rose-400 dark:border-rose-600 ring-1 ring-rose-400' : ''}`}
                  placeholder={t.enterPassword}
                  value={form.password}
                  onChange={e => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: '' }); }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <MdVisibilityOff className="text-xl" /> : <MdVisibility className="text-xl" />}
                </button>
              </div>
              {errors.password && <p className="text-rose-500 text-xs mt-1.5 font-medium">{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-lg py-4 mt-2"
            >
              {loading ? (
                <>
                  <span className="spinner scale-75" />
                  {t.loggingIn}
                </>
              ) : (
                <>
                  <MdLock className="text-xl" />
                  {t.login}
                </>
              )}
            </button>
          </form>

          {/* Hint */}
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
            {language === 'te' 
              ? 'అడ్మిన్ ద్వారా సెటప్ చేయబడిన వినియోగదారు ఖాతా' 
              : 'Single family account · Secured with encryption'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
