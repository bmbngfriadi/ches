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
              Reset Your<br />Password
            </h1>
            <div className="w-12 h-1.5 bg-white mb-6 rounded-full opacity-90" />
            <p className="text-lg text-white/90 max-w-md leading-relaxed font-medium">
              Lupa password Anda? Masukkan alamat email yang terdaftar dan kami akan mengirimkan tautan reset password.
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
              Lupa Password?
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
              Masukkan alamat email Anda yang terdaftar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-[#b52025] transition-colors" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#b52025]/20 focus:border-[#b52025] transition-all text-gray-900 dark:text-white shadow-sm"
                  placeholder="contoh@email.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#b52025] hover:bg-[#8c191c] focus:outline-none focus:ring-4 focus:ring-[#b52025]/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed group shadow-md hover:shadow-lg"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Kirim Link Reset'}
            </button>
            
            <div className="text-center lg:text-left mt-6">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center justify-center lg:justify-start w-full lg:w-auto transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Kembali ke Login
              </button>
            </div>
          </form>
          
          <div className="mt-12 text-center lg:text-left text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider">
            &copy; {new Date().getFullYear()} Semen Merah Putih
          </div>
        </div>
      </div>
    </div>
  );
}
