import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckSquare, Square } from 'lucide-react';
import api from '../api';
import { useAlert } from '../context/AlertContext';

export default function UserManagement() {
  const { showAlert } = useAlert();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState({ username: '', password: '', full_name: '', email: '' });
  
  const currentUser = JSON.parse(localStorage.getItem('ches_user') || '{}');
  const isAdmin = currentUser.role === 'administrator/dev';

  // Hardcoded permissions list based on schema
  const availablePermissions = [
    { id: 1, name: 'cardlog_view', label: 'View Cardlogs' },
    { id: 2, name: 'cardlog_add', label: 'Add Cardlogs' },
    { id: 3, name: 'cardlog_edit', label: 'Edit Cardlogs' },
    { id: 4, name: 'cardlog_delete', label: 'Delete Cardlogs' },
    { id: 5, name: 'cardlog_export', label: 'Export Cardlogs (Excel)' },
    { id: 8, name: 'cardlog_export_png', label: 'Export to PNG' },
    { id: 6, name: 'cardlog_edit_1h', label: 'Edit Cardlogs (Max 1 Hour)' },
    { id: 9, name: 'receive_email_notification', label: 'Receive Email Notifications' },
    { id: 10, name: 'resend_email_notification', label: 'Resend Email Notification' },
    { id: 7, name: 'user_management', label: 'Manage Users' },
  ];
  
  const [selectedPermissions, setSelectedPermissions] = useState([1, 2]); // Default permissions

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (permId) => {
    setSelectedPermissions(prev => 
      prev.includes(permId) 
        ? prev.filter(id => id !== permId)
        : [...prev, permId]
    );
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    
    showAlert(
      'Konfirmasi Simpan',
      `Apakah Anda yakin ingin menyimpan data pengguna ${userForm.username}?`,
      'confirm',
      async () => {
        try {
          if (editingUserId) {
            await api.put(`/users/${editingUserId}`, {
              username: userForm.username,
              full_name: userForm.full_name,
              password: userForm.password,
              email: userForm.email,
              permissions: selectedPermissions
            });

            // Sync with localStorage if editing own account
            const currentUser = JSON.parse(localStorage.getItem('ches_user') || '{}');
            if (currentUser.id === editingUserId) {
              currentUser.username = userForm.username;
              currentUser.full_name = userForm.full_name;
              currentUser.email = userForm.email;
              localStorage.setItem('ches_user', JSON.stringify(currentUser));
            }

            showAlert('Sukses!', 'User berhasil diupdate!', 'success');
          } else {
            await api.post('/users', {
              ...userForm,
              permissions: selectedPermissions
            });
            showAlert('Sukses!', 'User berhasil ditambahkan!', 'success');
          }
          setShowForm(false);
          setEditingUserId(null);
          setUserForm({ username: '', password: '', full_name: '', email: '' });
          setSelectedPermissions([1, 2]);
          fetchUsers();
        } catch (err) {
          showAlert('Gagal!', `Gagal ${editingUserId ? 'mengupdate' : 'menambahkan'} user: ` + (err.response?.data?.message || err.message), 'error');
        }
      }
    );
  };

  const handleEditClick = (user) => {
    setEditingUserId(user.id);
    setUserForm({ username: user.username, full_name: user.full_name, email: user.email || '', password: '' });
    setSelectedPermissions(user.permissions || []);
    setShowForm(true);
  };

  const handleAddClick = () => {
    setEditingUserId(null);
    setUserForm({ username: '', password: '', full_name: '', email: '' });
    setSelectedPermissions([1, 2]);
    setShowForm(!showForm);
  };

  const handleDeleteUser = async (id) => {
    showAlert(
      'Konfirmasi Hapus',
      'Yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.',
      'confirm',
      async () => {
        try {
          await api.delete(`/users/${id}`);
          fetchUsers();
          showAlert('Sukses!', 'User berhasil dihapus', 'success');
        } catch (err) {
          showAlert('Gagal!', 'Gagal menghapus user', 'error');
        }
      }
    );
  };

  const handleChangeRole = async (id, newRole) => {
    try {
      await api.put(`/users/${id}/role`, { role: newRole });
      showAlert('Sukses!', 'Role berhasil diubah', 'success');
      fetchUsers();
    } catch (err) {
      showAlert('Gagal!', 'Gagal mengubah role: ' + (err.response?.data?.message || err.message), 'error');
      fetchUsers(); // Revert back UI on fail
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">User Management</h1>
          <p className="text-sm text-[var(--text-secondary)] font-medium mt-1">Kelola akun dan hak akses pengguna.</p>
        </div>
        <button 
          onClick={handleAddClick}
          className="flex items-center justify-center whitespace-nowrap px-6 py-3.5 sm:px-4 sm:py-2.5 text-base sm:text-sm bg-[var(--primary-500)] text-white rounded-xl font-bold hover:bg-[var(--primary-600)] transition-all shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.23)] hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-5 h-5 mr-1.5 flex-shrink-0" />
          <span>{showForm && !editingUserId ? 'Batal' : 'Tambah User'}</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-[var(--surface)] p-6 md:p-8 rounded-2xl border border-[var(--border-color)] relative shadow-sm animate-in slide-in-from-top-4 fade-in duration-300">
          {editingUserId && (
             <button onClick={() => setShowForm(false)} className="absolute top-6 right-6 p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded-full transition-colors"><Trash2 className="w-5 h-5 hidden" />Batal</button>
          )}
          <h2 className="text-xl font-extrabold text-[var(--text-primary)] mb-6">
            {editingUserId ? `Edit User: ${userForm.username}` : 'Buat User Baru'}
          </h2>
          <form onSubmit={handleSubmitUser} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Username</label>
                <input required type="text" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} disabled={!!editingUserId && !isAdmin} className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]/30 focus:border-[var(--primary-500)] transition-all disabled:opacity-50 disabled:bg-[var(--surface-50)]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Full Name</label>
                <input required type="text" value={userForm.full_name} onChange={e => setUserForm({...userForm, full_name: e.target.value})} disabled={!!editingUserId && !isAdmin} className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]/30 focus:border-[var(--primary-500)] transition-all disabled:opacity-50 disabled:bg-[var(--surface-50)]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">{editingUserId ? 'New Password (opsional)' : 'Password'}</label>
                <input required={!editingUserId} type="password" placeholder={editingUserId ? 'Kosongkan jika tidak diubah' : ''} value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]/30 focus:border-[var(--primary-500)] transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Email</label>
                <input type="email" placeholder="contoh@email.com" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]/30 focus:border-[var(--primary-500)] transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Hak Akses (Permissions)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {availablePermissions.map(perm => (
                  <button
                    key={perm.id}
                    type="button"
                    onClick={() => handleTogglePermission(perm.id)}
                    className={`flex items-center space-x-3 p-3.5 rounded-xl border-2 text-left transition-all duration-200 ${
                      selectedPermissions.includes(perm.id) 
                        ? 'bg-[var(--primary-50)] border-[var(--primary-500)] text-[var(--primary-600)] dark:bg-[var(--primary-900)]/20'
                        : 'bg-[var(--surface)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--primary-500)]/30'
                    }`}
                  >
                    {selectedPermissions.includes(perm.id) ? <CheckSquare className="w-5 h-5 text-[var(--primary-500)]" /> : <Square className="w-5 h-5" />}
                    <span className="font-bold text-sm tracking-tight">{perm.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" className="w-full sm:w-auto px-8 py-3.5 sm:px-6 sm:py-3 text-base sm:text-sm bg-[var(--text-primary)] text-[var(--surface)] rounded-xl font-bold hover:opacity-90 transition-opacity shadow-md">
                {editingUserId ? 'Update User' : 'Simpan User'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm">
        {/* Desktop Table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full divide-y divide-[var(--border-color)]">
            <thead className="bg-[var(--surface-50)] border-b border-[var(--border-color)]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Username</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Full Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Created At</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-skeleton">
                    <td className="px-6 py-4"><div className="h-4 bg-[var(--border-color)] rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-[var(--border-color)] rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-[var(--border-color)] rounded w-40"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-[var(--border-color)] rounded-lg w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-[var(--border-color)] rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-[var(--border-color)] rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : users.map((user, index) => (
                <tr 
                  key={user.id} 
                  className={`hover:bg-[var(--surface-hover)] cursor-pointer transition-colors group animate-page-enter`}
                  onClick={() => handleEditClick(user)}
                >
                  <td className="px-6 py-4 text-sm font-extrabold text-[var(--text-primary)]">@{user.username}</td>
                  <td className="px-6 py-4 text-sm font-medium text-[var(--text-secondary)]">{user.full_name}</td>
                  <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{user.email || '-'}</td>
                  <td className="px-6 py-4 text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                    {isAdmin ? (
                      <select 
                        value={user.role || 'user'} 
                        onChange={(e) => handleChangeRole(user.id, e.target.value)}
                        className="bg-transparent border border-[var(--border-color)] rounded-lg py-1.5 px-3 text-sm text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--primary-500)] focus:ring-1 focus:ring-[var(--primary-500)]/30 hover:border-[var(--primary-400)] transition-all cursor-pointer"
                      >
                        <option value="administrator/dev">Administrator/Dev</option>
                        <option value="port & dispatch section head">Port & Dispatch Section Head</option>
                        <option value="port & dispatch admin">Port & Dispatch Admin</option>
                        <option value="operator">Operator</option>
                        <option value="user">User Biasa</option>
                      </select>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wider ${user.role === 'administrator/dev' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800' : 'bg-[var(--surface-50)] text-[var(--text-secondary)] border border-[var(--border-color)]'}`}>
                        {(user.role || 'user').toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-[var(--text-secondary)]">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleEditClick(user)} className="text-blue-600 hover:text-white hover:bg-blue-600 p-2 rounded-lg mr-1 transition-colors" title="Edit User">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </button>
                    <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-white hover:bg-red-600 p-2 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-red-600 transition-colors" disabled={user.username === 'admin'} title="Hapus User">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="grid grid-cols-1 gap-4 p-4 md:hidden bg-[var(--bg-default)]">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border-color)] flex flex-col space-y-4 shadow-sm animate-skeleton">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="h-4 bg-[var(--border-color)] rounded w-24 mb-2"></div>
                    <div className="h-3 bg-[var(--border-color)] rounded w-32"></div>
                  </div>
                  <div className="h-6 bg-[var(--border-color)] rounded w-20"></div>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-[var(--border-color)] mt-2">
                  <div className="h-3 bg-[var(--border-color)] rounded w-24"></div>
                  <div className="flex space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-[var(--border-color)]"></div>
                    <div className="w-8 h-8 rounded-xl bg-[var(--border-color)]"></div>
                  </div>
                </div>
              </div>
            ))
          ) : users.map((user, index) => (
            <div 
              key={user.id}
              className={`bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border-color)] flex flex-col space-y-4 cursor-pointer shadow-sm active:scale-[0.98] transition-transform animate-page-enter`}
              onClick={() => handleEditClick(user)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-extrabold text-[var(--primary-600)] dark:text-[var(--primary-400)]">@{user.username}</div>
                  <div className="text-xs font-bold text-[var(--text-secondary)] mt-1">{user.full_name}</div>
                </div>
                <div className="text-right" onClick={(e) => e.stopPropagation()}>
                  {isAdmin ? (
                    <select 
                      value={user.role || 'user'} 
                      onChange={(e) => handleChangeRole(user.id, e.target.value)}
                      className="bg-[var(--surface-50)] border border-[var(--border-color)] rounded-lg py-1 px-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-500)]"
                    >
                      <option value="administrator/dev">Admin/Dev</option>
                      <option value="port & dispatch section head">P&D Head</option>
                      <option value="port & dispatch admin">P&D Admin</option>
                      <option value="operator">Operator</option>
                      <option value="user">User Biasa</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-[10px] font-extrabold tracking-wider border ${user.role === 'administrator/dev' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' : 'bg-[var(--surface-50)] text-[var(--text-secondary)] border-[var(--border-color)]'}`}>
                      {(user.role || 'user').toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-[var(--border-color)] mt-2">
                <div className="text-xs font-medium text-[var(--text-secondary)]">
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
                <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleEditClick(user)} className="p-2.5 text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-xl" title="Edit">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  </button>
                  <button onClick={() => handleDeleteUser(user.id)} className="p-2.5 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl disabled:opacity-30" disabled={user.username === 'admin'} title="Hapus">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
