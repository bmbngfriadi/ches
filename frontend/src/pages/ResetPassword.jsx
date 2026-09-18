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
              <span className="hidden lg:inline">Create New<br />Password</span>
            </h1>
            <div className="hidden lg:block w-12 h-1.5 bg-white mb-6 rounded-full opacity-90 shadow-sm" />
            <p className="text-white/90 text-sm lg:text-lg max-w-md leading-relaxed font-medium mx-auto lg:mx-0 drop-shadow-sm">
              <span className="lg:hidden">Cardlog Heavy Equipment System</span>
              <span className="hidden lg:inline">Silakan buat password baru Anda. Pastikan password Anda kuat dan aman.</span>
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
              Buat Password Baru
            </h2>
            <p className="text-[var(--text-secondary)] mt-2 font-medium">
              Silakan masukkan password baru Anda.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">
                Password Baru
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-[var(--text-secondary)] group-focus-within:text-[var(--primary-500)] transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 bg-[var(--surface)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent transition-all text-[var(--text-primary)] shadow-sm"
                  placeholder="Masukkan password baru"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">
                Konfirmasi Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-[var(--text-secondary)] group-focus-within:text-[var(--primary-500)] transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 bg-[var(--surface)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent transition-all text-[var(--text-primary)] shadow-sm"
                  placeholder="Ulangi password baru"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 btn-primary group"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Simpan Password Baru'}
            </button>
          </form>
          
          <div className="mt-12 text-center lg:text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            &copy; {new Date().getFullYear()} Semen Merah Putih
          </div>
        </div>
      </div>
    </div>
  );
}
