import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { KeyRound, ArrowRight, Loader2 } from 'lucide-react';
import api from '../api';
import { useAlert } from '../context/AlertContext';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showAlert('Gagal', 'Password dan Konfirmasi Password tidak cocok!', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', { token, newPassword: password });
      showAlert('Berhasil', response.data.message || 'Password berhasil diubah. Silakan login.', 'success');
      navigate('/login');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Gagal mereset password. Token mungkin tidak valid atau sudah kedaluwarsa.';
      showAlert('Gagal', errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-950 items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <img src="https://i.ibb.co.com/prMYS06h/LOGO-2025-03.png" alt="Logo" className="h-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Buat Password Baru</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Silakan masukkan password baru Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Password Baru
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-md focus:ring-1 focus:ring-[#b52025] focus:border-[#b52025] text-gray-900 dark:text-white"
                placeholder="Masukkan password baru"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Konfirmasi Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-md focus:ring-1 focus:ring-[#b52025] focus:border-[#b52025] text-gray-900 dark:text-white"
                placeholder="Ulangi password baru"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-[#b52025] hover:bg-[#8c191c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b52025] disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Simpan Password Baru'}
          </button>
        </form>
      </div>
    </div>
  );
}
