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
              Email<br />Verification
            </h1>
            <div className="w-12 h-1.5 bg-white mb-6 rounded-full opacity-90" />
            <p className="text-lg text-white/90 max-w-md leading-relaxed font-medium">
              Verifikasi alamat email Anda untuk mulai menggunakan sistem Cardlog.
            </p>
          </div>
          
          <div className="text-white/70 text-sm font-semibold tracking-wide">
            PT CEMINDO GEMILANG TBK - PLANT BATAM
          </div>
        </div>
      </div>

      {/* Right side - Content */}
      <div className="w-full lg:w-7/12 flex flex-col justify-center px-6 sm:px-16 xl:px-24 relative py-12">
        <div className="w-full max-w-md mx-auto lg:mx-0 xl:ml-16 text-center lg:text-left">
          <div className="lg:hidden bg-white p-3 rounded-xl inline-block mb-6 shadow-sm border border-gray-100 dark:bg-gray-900 dark:border-gray-800">
            <img src="https://i.ibb.co.com/prMYS06h/LOGO-2025-03.png" alt="Semen Merah Putih Logo" className="h-10 object-contain" />
          </div>
          
          <div className="mb-8 flex justify-center lg:justify-start">
            {status === 'loading' && <Loader2 className="w-16 h-16 text-[#b52025] animate-spin" />}
            {status === 'success' && <CheckCircle className="w-16 h-16 text-green-500" />}
            {status === 'error' && <XCircle className="w-16 h-16 text-red-500" />}
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
            {status === 'loading' ? 'Memverifikasi...' : status === 'success' ? 'Verifikasi Berhasil!' : 'Verifikasi Gagal'}
          </h2>
          
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-10 text-lg">
            {status === 'loading' 
              ? 'Mohon tunggu sebentar, kami sedang memverifikasi alamat email Anda.'
              : message
            }
          </p>

          {status !== 'loading' && (
            <Link
              to="/login"
              className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#b52025] hover:bg-[#8c191c] focus:outline-none focus:ring-4 focus:ring-[#b52025]/30 transition-all shadow-md hover:shadow-lg"
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
