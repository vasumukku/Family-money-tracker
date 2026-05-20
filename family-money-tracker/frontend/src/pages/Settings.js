import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  MdSettings, MdLock, MdLanguage, MdPalette, MdPerson,
  MdVisibility, MdVisibilityOff, MdSave, MdWbSunny, MdDarkMode,
} from 'react-icons/md';
import { api, useApp, useT } from '../context/AppContext';

const Settings = () => {
  const { user, language, setLanguage, theme, setTheme, updateUser } = useApp();
  const t = useT();

  const [name, setName] = useState(user?.name || '');
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, newPass: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const { data } = await api.put('/auth/update-preferences', { name, language, theme });
      if (data.success) { updateUser(data.user); toast.success(t.settingsSaved); }
    } catch { toast.error('Failed to save'); }
    finally { setSavingProfile(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) { toast.error('New passwords do not match'); return; }
    if (passwords.newPass.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSavingPw(true);
    try {
      await api.put('/auth/update-password', { currentPassword: passwords.current, newPassword: passwords.newPass });
      toast.success(t.passwordUpdated);
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally { setSavingPw(false); }
  };

  const PwInput = ({ field, label }) => (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
        <input type={showPw[field] ? 'text' : 'password'}
          className="input pl-11 pr-11"
          value={passwords[field]}
          onChange={e => setPasswords(prev => ({ ...prev, [field]: e.target.value }))} />
        <button type="button" onClick={() => setShowPw(prev => ({ ...prev, [field]: !prev[field] }))}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {showPw[field] ? <MdVisibilityOff className="text-xl" /> : <MdVisibility className="text-xl" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <MdSettings className="text-blue-600 dark:text-blue-400" />
          {t.settings}
        </h1>
      </div>

      {/* Profile */}
      <div className="card p-5 space-y-4">
        <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base">
          <MdPerson className="text-blue-500" /> Profile
        </h2>
        <div>
          <label className="label">{t.profileName}</label>
          <input type="text" className="input" value={name} onChange={e => setName(e.target.value)}
            placeholder="Your name" />
        </div>
        <div>
          <label className="label text-gray-400">Username</label>
          <input type="text" className="input opacity-60 cursor-not-allowed" value={user?.username} disabled />
          <p className="text-xs text-gray-400 mt-1">Username cannot be changed</p>
        </div>
        <button onClick={handleSaveProfile} disabled={savingProfile} className="btn-primary w-full">
          {savingProfile ? <><span className="spinner scale-75" />Saving...</> : <><MdSave />Save Profile</>}
        </button>
      </div>

      {/* Appearance */}
      <div className="card p-5 space-y-4">
        <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base">
          <MdPalette className="text-purple-500" /> Appearance
        </h2>

        {/* Theme */}
        <div>
          <label className="label">{t.theme}</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { val: 'light', icon: MdWbSunny, label: t.lightMode, color: 'text-yellow-500' },
              { val: 'dark', icon: MdDarkMode, label: t.darkMode, color: 'text-indigo-500' },
            ].map(({ val, icon: Icon, label, color }) => (
              <button key={val} type="button" onClick={() => setTheme(val)}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 font-semibold text-sm
                  ${theme === val
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'}`}>
                <Icon className={`text-2xl ${theme === val ? color : 'text-gray-400'}`} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="label"><MdLanguage className="inline mr-1" />{t.language}</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { val: 'en', label: '🇬🇧 English' },
              { val: 'te', label: '🇮🇳 తెలుగు' },
            ].map(({ val, label }) => (
              <button key={val} type="button" onClick={() => setLanguage(val)}
                className={`p-4 rounded-xl border-2 transition-all font-semibold text-sm
                  ${language === val
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSaveProfile} disabled={savingProfile} className="btn-secondary w-full">
          {savingProfile ? <><span className="spinner scale-75" />Saving...</> : <><MdSave />Save Preferences</>}
        </button>
      </div>

      {/* Change Password */}
      <div className="card p-5">
        <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base mb-4">
          <MdLock className="text-rose-500" /> {t.changePassword}
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <PwInput field="current" label={t.currentPassword} />
          <PwInput field="newPass" label={t.newPassword} />
          <PwInput field="confirm" label={t.confirmPassword} />
          <button type="submit" disabled={savingPw || !passwords.current || !passwords.newPass || !passwords.confirm}
            className="btn-primary w-full disabled:opacity-60">
            {savingPw ? <><span className="spinner scale-75" />Updating...</> : <><MdLock />{t.changePassword}</>}
          </button>
        </form>
      </div>

      {/* Info */}
      <div className="card p-5 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
        <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">ℹ️ App Info</h3>
        <div className="space-y-1 text-sm text-blue-700 dark:text-blue-400">
          <p>📱 Family Money Tracker v1.0</p>
          <p>🔒 Data stored securely in MongoDB Atlas</p>
          <p>☁️ Cloud storage — data is permanent</p>
          <p>🌏 Telugu + English support</p>
          <p>💾 Export to Excel anytime</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
