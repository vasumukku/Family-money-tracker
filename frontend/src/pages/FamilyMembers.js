import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { MdPeople, MdAdd, MdEdit, MdDelete, MdVisibility, MdVisibilityOff, MdPerson } from 'react-icons/md';
import { api } from '../context/AppContext';

const FamilyMembers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name:'', username:'', password:'' });
  const [errors, setErrors] = useState({});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/auth/users');
      if (data.success) setUsers(data.users);
    } catch { toast.error('Failed to load members'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openAdd = () => { setForm({ name:'', username:'', password:'' }); setEditUser(null); setErrors({}); setShowForm(true); };
  const openEdit = (u) => { setForm({ name:u.name, username:u.username, password:'' }); setEditUser(u); setErrors({}); setShowForm(true); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!editUser && !form.username.trim()) e.username = 'Username is required';
    if (!editUser && form.password.length < 4) e.password = 'Minimum 4 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editUser) {
        const payload = { name: form.name };
        if (form.password) payload.password = form.password;
        await api.put(`/auth/users/${editUser._id}`, payload);
        toast.success('Member updated!');
      } else {
        await api.post('/auth/users', { ...form, role: 'viewer' });
        toast.success('Member added! They can now login and view.');
      }
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleToggleActive = async (u) => {
    try {
      await api.put(`/auth/users/${u._id}`, { isActive: !u.isActive });
      toast.success(u.isActive ? 'Account deactivated' : 'Account activated');
      fetchUsers();
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/auth/users/${deleteId}`);
      toast.success('Member deleted');
      setDeleteId(null);
      fetchUsers();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2"><MdPeople className="text-blue-600 dark:text-blue-400" />Family Members</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Members can view balance and history — cannot edit</p>
        </div>
        <button onClick={openAdd} className="btn-primary py-2.5 px-4 text-sm"><MdAdd className="text-lg" /> Add Member</button>
      </div>

      {/* Info card */}
      <div className="card p-4 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">👁 Viewer Access Includes:</p>
        <div className="grid grid-cols-2 gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400">
          <span>✅ View Dashboard & Balance</span>
          <span>✅ View Transaction History</span>
          <span>✅ View Charts & Reports</span>
          <span>✅ Download Excel</span>
          <span>❌ Cannot Add Transactions</span>
          <span>❌ Cannot Edit or Delete</span>
        </div>
      </div>

      {/* Members list */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="spinner w-8 h-8 border-4" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <MdPeople className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No family members yet</p>
            <p className="text-sm text-gray-400 mt-1">Add your father, mother or other family members</p>
            <button onClick={openAdd} className="btn-primary mt-4 py-2.5 px-5 text-sm mx-auto"><MdAdd /> Add First Member</button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {users.map(u => (
              <div key={u._id} className="flex items-center gap-4 p-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 bg-emerald-500">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{u.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                      👁 Viewer
                    </span>
                    {!u.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">inactive</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">@{u.username}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleToggleActive(u)} title={u.isActive ? 'Deactivate' : 'Activate'}
                    className={`p-2 rounded-lg transition-all text-lg ${u.isActive ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                    {u.isActive ? <MdVisibility /> : <MdVisibilityOff />}
                  </button>
                  <button onClick={() => openEdit(u)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-lg"><MdEdit /></button>
                  <button onClick={() => setDeleteId(u._id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg text-lg"><MdDelete /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md shadow-2xl animate-scale-in">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <MdPerson className="text-emerald-500" />
              {editUser ? 'Edit Member' : 'Add Family Member'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input className={`input ${errors.name ? 'border-rose-400 ring-1 ring-rose-400' : ''}`}
                  placeholder="e.g. Father, అమ్మ, Nanna..."
                  value={form.name} onChange={e => setForm({...form, name:e.target.value})} />
                {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
              </div>
              {!editUser && (
                <div>
                  <label className="label">Username * (used to login)</label>
                  <input className={`input ${errors.username ? 'border-rose-400 ring-1 ring-rose-400' : ''}`}
                    placeholder="e.g. father, amma, nanna123"
                    value={form.username} onChange={e => setForm({...form, username:e.target.value.toLowerCase().replace(/\s/g,'')})} />
                  {errors.username && <p className="text-rose-500 text-xs mt-1">{errors.username}</p>}
                  <p className="text-xs text-gray-400 mt-1">No spaces allowed. All lowercase.</p>
                </div>
              )}
              <div>
                <label className="label">{editUser ? 'New Password (leave blank to keep same)' : 'Password *'}</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'}
                    className={`input pr-12 ${errors.password ? 'border-rose-400 ring-1 ring-rose-400' : ''}`}
                    placeholder="Min 4 characters"
                    value={form.password} onChange={e => setForm({...form, password:e.target.value})} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <MdVisibilityOff className="text-xl" /> : <MdVisibility className="text-xl" />}
                  </button>
                </div>
                {errors.password && <p className="text-rose-500 text-xs mt-1">{errors.password}</p>}
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-xs text-emerald-700 dark:text-emerald-400">
                👁 This member will be a <strong>Viewer</strong> — can see everything but cannot add, edit or delete transactions.
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-[2]">
                  {saving ? <><span className="spinner scale-75" />Saving...</> : editUser ? 'Update Member' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-sm shadow-2xl">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MdDelete className="text-rose-500 text-3xl" />
            </div>
            <h3 className="text-lg font-bold text-center mb-2">Delete Member?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">This member will no longer be able to login.</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn-danger"><MdDelete />Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyMembers;
