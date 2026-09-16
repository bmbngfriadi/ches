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
    <div className="login-split-container">
      {/* Left side (Top on mobile) */}
      <div className="login-left-panel">
        <div className="login-brand-wrapper text-center lg:text-left mx-auto lg:mx-0 lg:ml-12 xl:ml-20 flex flex-col h-full justify-center lg:justify-start lg:py-12">
          <div>
            <div className="bg-white p-3 rounded-xl inline-block mb-4 lg:mb-10 shadow-lg border border-white/20">
              <img src="https://i.ibb.co.com/prMYS06h/LOGO-2025-03.png" alt="Semen Merah Putih Logo" className="h-9 lg:h-10 object-contain" />
            </div>
            <h1 className="text-2xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight mb-2 lg:mb-6 leading-tight text-white drop-shadow-sm">
              <span className="lg:hidden">CHES Portal</span>
              <span className="hidden lg:inline">Reset Your<br />Password</span>
            </h1>
            <div className="hidden lg:block w-12 h-1.5 bg-white mb-6 rounded-full opacity-90 shadow-sm" />
            <p className="text-white/90 text-sm lg:text-lg max-w-md leading-relaxed font-medium mx-auto lg:mx-0 drop-shadow-sm">
              <span className="lg:hidden">Cardlog Heavy Equipment System</span>
              <span className="hidden lg:inline">Lupa password Anda? Masukkan alamat email yang terdaftar dan kami akan mengirimkan tautan reset password.</span>
            </p>
          </div>
          <div className="hidden lg:block mt-auto pt-16 text-white/70 text-sm font-semibold tracking-wide">
            PT CEMINDO GEMILANG TBK - PLANT BATAM
          </div>
        </div>
      </div>

      {/* Right side (Bottom overlapping card on mobile) */}
      <div className="login-right-panel">
        <div className="login-right-content">
          <div className="mb-8 lg:mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Lupa Password?
            </h2>
            <p className="text-[var(--text-secondary)] mt-2 font-medium">
              Masukkan alamat email Anda yang terdaftar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-[var(--text-primary)] mb-2">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[var(--text-secondary)] group-focus-within:text-[var(--primary-500)] transition-colors" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 bg-[var(--surface)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent transition-all text-[var(--text-primary)] shadow-sm"
                  placeholder="contoh@email.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[var(--primary-500)] hover:bg-[var(--primary-600)] focus:outline-none focus:ring-4 focus:ring-[var(--primary-500)]/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed group shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.23)] hover:-translate-y-0.5"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Kirim Link Reset'}
            </button>
            
            <div className="text-center lg:text-left mt-6">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--primary-500)] flex items-center justify-center lg:justify-start w-full lg:w-auto transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Kembali ke Login
              </button>
            </div>
          </form>
          
          <div className="mt-12 text-center lg:text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            &copy; {new Date().getFullYear()} Semen Merah Putih
          </div>
        </div>
      </div>
    </div>
  );
}
