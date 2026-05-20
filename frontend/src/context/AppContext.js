import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { translations } from '../i18n/translations';

const AppContext = createContext();
const API_URL = process.env.REACT_APP_API_URL || '/api';

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fmt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fmt_token');
      localStorage.removeItem('fmt_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fmt_user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('fmt_token'));
  const [language, setLanguageState] = useState(() => localStorage.getItem('fmt_lang') || 'en');
  const [theme, setThemeState] = useState(() => localStorage.getItem('fmt_theme') || 'light');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { username, password });
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('fmt_token', data.token);
        localStorage.setItem('fmt_user', JSON.stringify(data.user));
        if (data.user.language) setLanguage(data.user.language);
        if (data.user.theme) setTheme(data.user.theme);
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    setToken(null); setUser(null);
    localStorage.removeItem('fmt_token');
    localStorage.removeItem('fmt_user');
  }, []);

  const setLanguage = (lang) => { setLanguageState(lang); localStorage.setItem('fmt_lang', lang); };
  const setTheme = (t) => { setThemeState(t); localStorage.setItem('fmt_theme', t); };
  const updateUser = (u) => { setUser(u); localStorage.setItem('fmt_user', JSON.stringify(u)); };

  return (
    <AppContext.Provider value={{
      user, token, language, theme, loading,
      isAuthenticated: !!token,
      login, logout, setLanguage, setTheme, updateUser, api,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};

export const useT = () => {
  const { language } = useApp();
  return translations[language] || translations.en;
};
