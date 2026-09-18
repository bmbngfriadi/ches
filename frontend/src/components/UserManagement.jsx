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
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>Kelola akun dan hak akses pengguna.</p>
        </div>
        <button 
          onClick={handleAddClick}
          className={showForm && !editingUserId ? "btn-secondary" : "btn-primary"}
        >
          <Plus className={`w-5 h-5 mr-1.5 flex-shrink-0 transition-transform ${showForm && !editingUserId ? 'rotate-45' : ''}`} />
          <span>{showForm && !editingUserId ? 'Batal' : 'Tambah User'}</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-[var(--surface)] p-6 md:p-8 rounded-2xl border border-[var(--border-color)] relative shadow-sm animate-in slide-in-from-top-4 fade-in duration-300">
          {editingUserId && (
             <button onClick={() => setShowForm(false)} className="absolute top-6 right-6 p-2 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors flex items-center gap-1"><Trash2 className="w-5 h-5 hidden" />Batal</button>
          )}
          <h2 className="text-xl font-extrabold text-[var(--text-primary)] mb-6">
            {editingUserId ? `Edit User: ${userForm.username}` : 'Buat User Baru'}
          </h2>
          <form onSubmit={handleSubmitUser} className="space-y-8">
            <div className="form-grid-2 lg:grid-cols-4">
              <div className="form-group">
                <label>Username</label>
                <input required type="text" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} disabled={!!editingUserId && !isAdmin} className="form-control disabled:opacity-50" />
              </div>
              <div className="form-group">
                <label>Full Name</label>
                <input required type="text" value={userForm.full_name} onChange={e => setUserForm({...userForm, full_name: e.target.value})} disabled={!!editingUserId && !isAdmin} className="form-control disabled:opacity-50" />
              </div>
              <div className="form-group">
                <label>{editingUserId ? 'New Password (opsional)' : 'Password'}</label>
                <input required={!editingUserId} type="password" placeholder={editingUserId ? 'Kosongkan jika tidak diubah' : ''} value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="form-control" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="contoh@email.com" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="form-control" />
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

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created At</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-skeleton">
                  <td data-label="Username"><div className="h-4 bg-[var(--border-color)] rounded w-24"></div></td>
                  <td data-label="Full Name"><div className="h-4 bg-[var(--border-color)] rounded w-32"></div></td>
                  <td data-label="Email"><div className="h-4 bg-[var(--border-color)] rounded w-40"></div></td>
                  <td data-label="Role"><div className="h-6 bg-[var(--border-color)] rounded-lg w-32"></div></td>
                  <td data-label="Created At"><div className="h-4 bg-[var(--border-color)] rounded w-24"></div></td>
                  <td data-label="Actions" className="md:text-right"><div className="h-8 bg-[var(--border-color)] rounded w-16 md:ml-auto"></div></td>
                </tr>
              ))
            ) : users.map((user, index) => (
              <tr key={user.id} className="group cursor-pointer" onClick={() => handleEditClick(user)}>
                <td data-label="Username" className="font-extrabold text-[var(--text-primary)]">@{user.username}</td>
                <td data-label="Full Name" className="font-medium text-[var(--text-secondary)]">{user.full_name}</td>
                <td data-label="Email" className="text-[var(--text-secondary)]">{user.email || '-'}</td>
                <td data-label="Role" onClick={(e) => e.stopPropagation()}>
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
                <td data-label="Created At" className="font-medium text-[var(--text-secondary)]">{new Date(user.created_at).toLocaleDateString()}</td>
                <td data-label="Actions" className="md:text-right">
                  <div className="flex md:justify-end items-center transition-opacity mt-2 md:mt-0" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleEditClick(user)} className="text-blue-600 dark:text-blue-400 hover:text-white bg-blue-50 dark:bg-blue-900/20 md:bg-transparent md:dark:bg-transparent hover:bg-blue-600 dark:hover:bg-blue-600 p-2 rounded-lg mr-2 transition-colors" title="Edit User">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </button>
                    <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 dark:text-red-400 hover:text-white bg-red-50 dark:bg-red-900/20 md:bg-transparent md:dark:bg-transparent hover:bg-red-600 dark:hover:bg-red-600 p-2 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent disabled:dark:hover:bg-transparent disabled:hover:text-red-600 disabled:dark:hover:text-red-400 transition-colors" disabled={user.username === 'admin'} title="Hapus User">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
