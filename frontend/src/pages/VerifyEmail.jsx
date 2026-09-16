import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await api.post('/auth/verify-email', { token });
        setStatus('success');
        setMessage(res.data.message);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Gagal memverifikasi email. Tautan mungkin telah kadaluarsa atau sudah digunakan.');
      }
    };
    if (token) {
      verify();
    }
  }, [token]);

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
              <span className="hidden lg:inline">Email<br />Verification</span>
            </h1>
            <div className="hidden lg:block w-12 h-1.5 bg-white mb-6 rounded-full opacity-90 shadow-sm" />
            <p className="text-white/90 text-sm lg:text-lg max-w-md leading-relaxed font-medium mx-auto lg:mx-0 drop-shadow-sm">
              <span className="lg:hidden">Cardlog Heavy Equipment System</span>
              <span className="hidden lg:inline">Verifikasi alamat email Anda untuk mulai menggunakan sistem Cardlog.</span>
            </p>
          </div>
          <div className="hidden lg:block mt-auto pt-16 text-white/70 text-sm font-semibold tracking-wide">
            PT CEMINDO GEMILANG TBK - PLANT BATAM
          </div>
        </div>
      </div>

      {/* Right side (Bottom overlapping card on mobile) */}
      <div className="login-right-panel">
        <div className="login-right-content text-center lg:text-left">
          <div className="mb-8 flex justify-center lg:justify-start">
            {status === 'loading' && <Loader2 className="w-16 h-16 text-[var(--primary-500)] animate-spin" />}
            {status === 'success' && <CheckCircle className="w-16 h-16 text-green-500" />}
            {status === 'error' && <XCircle className="w-16 h-16 text-red-500" />}
          </div>

          <h2 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mb-4">
            {status === 'loading' ? 'Memverifikasi...' : status === 'success' ? 'Verifikasi Berhasil!' : 'Verifikasi Gagal'}
          </h2>
          
          <p className="text-[var(--text-secondary)] font-medium mb-10 text-lg">
            {status === 'loading' 
              ? 'Mohon tunggu sebentar, kami sedang memverifikasi alamat email Anda.'
              : message
            }
          </p>

          {status !== 'loading' && (
            <Link
              to="/login"
              className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[var(--primary-500)] hover:bg-[var(--primary-600)] focus:outline-none focus:ring-4 focus:ring-[var(--primary-500)]/30 transition-all shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.23)] hover:-translate-y-0.5"
            >
              Lanjutkan ke Halaman Login
            </Link>
          )}

          <div className="mt-12 text-center lg:text-left text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider">
            &copy; {new Date().getFullYear()} Semen Merah Putih
          </div>
        </div>
      </div>
    </div>
  );
}
