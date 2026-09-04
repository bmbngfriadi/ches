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
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      {/* Left side - Modern Corporate Banner */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#b52025] relative items-center justify-center overflow-hidden">
        {/* Blueprint / Industrial Grid Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:30px_30px]" />
        
        {/* Sleek shadow overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/50" />
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/20 to-transparent" />

        <div className="z-10 w-full px-12 xl:px-16 text-white flex flex-col justify-between h-full py-12">
          <div>
            <div className="bg-white p-3 rounded-xl inline-block mb-10 shadow-lg border border-white/20">
              <img src="https://i.ibb.co.com/prMYS06h/LOGO-2025-03.png" alt="Semen Merah Putih Logo" className="h-10 object-contain" />
            </div>
            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
              Create New<br />Password
            </h1>
            <div className="w-12 h-1.5 bg-white mb-6 rounded-full opacity-90" />
            <p className="text-lg text-white/90 max-w-md leading-relaxed font-medium">
              Silakan buat password baru Anda. Pastikan password Anda kuat dan aman.
            </p>
          </div>
          
          <div className="text-white/70 text-sm font-semibold tracking-wide">
            PT CEMINDO GEMILANG TBK - PLANT BATAM
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-7/12 flex flex-col justify-center px-6 sm:px-16 xl:px-24 relative py-12">
        <div className="w-full max-w-md mx-auto lg:mx-0 xl:ml-16">
          <div className="mb-10 text-center lg:text-left">
            <div className="lg:hidden bg-white p-3 rounded-xl inline-block mb-6 shadow-sm border border-gray-100 dark:bg-gray-900 dark:border-gray-800">
              <img src="https://i.ibb.co.com/prMYS06h/LOGO-2025-03.png" alt="Semen Merah Putih Logo" className="h-10 object-contain" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Buat Password Baru
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
              Silakan masukkan password baru Anda.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Password Baru
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400 group-focus-within:text-[#b52025] transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#b52025]/20 focus:border-[#b52025] transition-all text-gray-900 dark:text-white shadow-sm"
                  placeholder="Masukkan password baru"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Konfirmasi Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400 group-focus-within:text-[#b52025] transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#b52025]/20 focus:border-[#b52025] transition-all text-gray-900 dark:text-white shadow-sm"
                  placeholder="Ulangi password baru"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#b52025] hover:bg-[#8c191c] focus:outline-none focus:ring-4 focus:ring-[#b52025]/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed group shadow-md hover:shadow-lg"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Simpan Password Baru'}
            </button>
          </form>
          
          <div className="mt-12 text-center lg:text-left text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider">
            &copy; {new Date().getFullYear()} Semen Merah Putih
          </div>
        </div>
      </div>
    </div>
  );
}
