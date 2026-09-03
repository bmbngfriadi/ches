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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 sm:p-10 text-center border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-300">
        <div className="mb-6 flex justify-center">
          {status === 'loading' && <Loader2 className="w-16 h-16 text-[#b52025] animate-spin" />}
          {status === 'success' && <CheckCircle className="w-16 h-16 text-green-500" />}
          {status === 'error' && <XCircle className="w-16 h-16 text-red-500" />}
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
          {status === 'loading' ? 'Memverifikasi...' : status === 'success' ? 'Verifikasi Berhasil!' : 'Verifikasi Gagal'}
        </h1>
        
        <p className="text-base sm:text-sm text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
          {status === 'loading' 
            ? 'Mohon tunggu sebentar, kami sedang memverifikasi alamat email Anda.'
            : message
          }
        </p>

        {status !== 'loading' && (
          <Link
            to="/login"
            className="inline-flex items-center justify-center w-full px-6 py-3.5 sm:py-2.5 text-base sm:text-sm font-bold text-white bg-[#b52025] rounded-md hover:bg-[#8c191c] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b52025]"
          >
            Lanjutkan ke Halaman Login
          </Link>
        )}
      </div>
    </div>
  );
}
