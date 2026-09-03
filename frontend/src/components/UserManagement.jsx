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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola akun dan hak akses pengguna.</p>
        </div>
        <button 
          onClick={handleAddClick}
          className="flex items-center whitespace-nowrap px-4 py-2.5 bg-[#b52025] text-white rounded-md font-bold hover:bg-[#8c191c] transition-colors"
        >
          <Plus className="w-5 h-5 mr-1.5 flex-shrink-0" />
          <span>{showForm && !editingUserId ? 'Batal' : 'Tambah User'}</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-950 p-6 rounded-md border border-gray-200 dark:border-gray-800 relative">
          {editingUserId && (
             <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">Batal</button>
          )}
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {editingUserId ? `Edit User: ${userForm.username}` : 'Buat User Baru'}
          </h2>
          <form onSubmit={handleSubmitUser} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Username</label>
                <input required type="text" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} disabled={!!editingUserId && !isAdmin} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-white disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input required type="text" value={userForm.full_name} onChange={e => setUserForm({...userForm, full_name: e.target.value})} disabled={!!editingUserId && !isAdmin} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-white disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{editingUserId ? 'New Password (opsional)' : 'Password'}</label>
                <input required={!editingUserId} type="password" placeholder={editingUserId ? 'Kosongkan jika tidak diubah' : ''} value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input type="email" placeholder="contoh@email.com" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-white" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Hak Akses (Permissions)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {availablePermissions.map(perm => (
                  <button
                    key={perm.id}
                    type="button"
                    onClick={() => handleTogglePermission(perm.id)}
                    className={`flex items-center space-x-2 p-3 rounded-md border text-left transition-colors ${
                      selectedPermissions.includes(perm.id) 
                        ? 'bg-red-50 dark:bg-red-900/20 border-[#b52025] text-[#b52025] dark:text-red-400'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {selectedPermissions.includes(perm.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    <span className="font-medium text-sm">{perm.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
                {editingUserId ? 'Update User' : 'Simpan User'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-950 rounded-md border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Desktop Table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
            <thead className="bg-gray-50/50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Username</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Full Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Email</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Role</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Created At</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {loading ? (
                <tr><td colSpan="5" className="p-6 text-center text-gray-500">Loading users...</td></tr>
              ) : users.map(user => (
                <tr 
                  key={user.id} 
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50 cursor-pointer transition-colors"
                  onClick={() => handleEditClick(user)}
                >
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{user.username}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{user.full_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.email || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400" onClick={(e) => e.stopPropagation()}>
                    {isAdmin ? (
                      <select 
                        value={user.role || 'user'} 
                        onChange={(e) => handleChangeRole(user.id, e.target.value)}
                        className="bg-transparent border border-gray-300 dark:border-gray-700 rounded-md py-1 px-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#b52025]"
                      >
                        <option value="administrator/dev">Administrator/Dev</option>
                        <option value="port & dispatch section head">Port & Dispatch Section Head</option>
                        <option value="port & dispatch admin">Port & Dispatch Admin</option>
                        <option value="operator">Operator</option>
                        <option value="user">User Biasa</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'administrator/dev' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
                        {(user.role || 'user').toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right flex justify-end items-center" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleEditClick(user)} className="text-blue-500 hover:text-blue-700 p-2 mr-1" title="Edit User">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </button>
                    <button onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:text-red-700 p-2" disabled={user.username === 'admin'} title="Hapus User">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
          {loading ? (
            <div className="text-center p-4 text-gray-500">Loading users...</div>
          ) : users.map(user => (
            <div 
              key={user.id}
              className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 border border-gray-200 dark:border-gray-800 flex flex-col space-y-3 cursor-pointer"
              onClick={() => handleEditClick(user)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">@{user.username}</div>
                  <div className="text-xs text-gray-500">{user.full_name}</div>
                </div>
                <div className="text-right" onClick={(e) => e.stopPropagation()}>
                  {isAdmin ? (
                    <select 
                      value={user.role || 'user'} 
                      onChange={(e) => handleChangeRole(user.id, e.target.value)}
                      className="bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md py-1 px-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#b52025]"
                    >
                      <option value="administrator/dev">Admin/Dev</option>
                      <option value="port & dispatch section head">P&D Head</option>
                      <option value="port & dispatch admin">P&D Admin</option>
                      <option value="operator">Operator</option>
                      <option value="user">User Biasa</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${user.role === 'administrator/dev' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
                      {(user.role || 'user').toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                <div className="text-xs text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
                <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleEditClick(user)} className="p-2 text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-md" title="Edit">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  </button>
                  <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md" disabled={user.username === 'admin'} title="Hapus">
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
