import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import api from '../api';
import { useAlert } from '../context/AlertContext';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await api.post('/auth/forgot-password', { email });
      showAlert('Berhasil', response.data.message || 'Email reset password telah dikirim.', 'success');
      navigate('/login');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Gagal mengirim email reset password. Pastikan email terdaftar.';
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Lupa Password?</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Masukkan alamat email Anda yang terdaftar. Kami akan mengirimkan tautan untuk mereset password Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-md focus:ring-1 focus:ring-[#b52025] focus:border-[#b52025] text-gray-900 dark:text-white"
                placeholder="contoh@email.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-[#b52025] hover:bg-[#8c191c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b52025] disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Kirim Link Reset'}
          </button>
          
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center justify-center w-full transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
