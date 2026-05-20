import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useApp, useT } from '../context/AppContext';
import {
  MdDashboard, MdHistory, MdAdd, MdSettings, MdLogout,
  MdMenu, MdClose, MdAccountBalance, MdWbSunny, MdDarkMode,
  MdLanguage,
} from 'react-icons/md';

const Layout = () => {
  const { user, logout, theme, setTheme, language, setLanguage } = useApp();
  const t = useT();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: MdDashboard, label: t.dashboard, end: true },
    { to: '/transactions', icon: MdHistory, label: t.history },
    { to: '/add', icon: MdAdd, label: t.addTransaction },
    { to: '/settings', icon: MdSettings, label: t.settings },
  ];

  const lang = language === 'te' ? 'font-te' : '';

  return (
    <div className={`min-h-screen flex bg-gray-50 dark:bg-gray-950 ${lang}`}>
      
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 fixed inset-y-0 left-0 z-40">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
              <MdAccountBalance className="text-white text-xl" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{t.appName}</h1>
              <p className="text-xs text-gray-400">{user?.name}</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                 ${isActive
                   ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm'
                   : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                 }`
              }
            >
              <Icon className="text-xl flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom controls */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          >
            {theme === 'light' ? <MdDarkMode className="text-lg" /> : <MdWbSunny className="text-lg text-yellow-400" />}
            {theme === 'light' ? t.darkMode : t.lightMode}
          </button>

          {/* Language toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'te' : 'en')}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          >
            <MdLanguage className="text-lg" />
            {language === 'en' ? 'తెలుగు' : 'English'}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
          >
            <MdLogout className="text-lg" />
            {t.logout}
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside className={`lg:hidden fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-900 z-50 shadow-2xl transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
              <MdAccountBalance className="text-white text-lg" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white text-sm">{t.appName}</h1>
              <p className="text-xs text-gray-400">{user?.name}</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <MdClose className="text-xl text-gray-500" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-semibold transition-all
                 ${isActive
                   ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                   : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                 }`
              }
            >
              <Icon className="text-2xl flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-1">
          <button
            onClick={() => { setTheme(theme === 'light' ? 'dark' : 'light'); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {theme === 'light' ? <MdDarkMode className="text-xl" /> : <MdWbSunny className="text-xl text-yellow-400" />}
            {theme === 'light' ? t.darkMode : t.lightMode}
          </button>
          <button
            onClick={() => { setLanguage(language === 'en' ? 'te' : 'en'); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <MdLanguage className="text-xl" />
            {language === 'en' ? 'తెలుగు' : 'English'}
          </button>
          <button
            onClick={() => { handleLogout(); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
          >
            <MdLogout className="text-xl" />
            {t.logout}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3.5 flex items-center justify-between shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 -ml-1">
            <MdMenu className="text-2xl text-gray-700 dark:text-gray-300" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
              <MdAccountBalance className="text-white text-sm" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-sm">{t.appName}</span>
          </div>
          <NavLink to="/add" className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
            <MdAdd className="text-xl" />
          </NavLink>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 page-enter">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden bottom-nav">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <Icon className={`text-2xl ${to === '/add' ? 'text-2xl' : ''}`} />
                <span className="text-[10px] font-semibold leading-tight text-center">{label.split(' ')[0]}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
