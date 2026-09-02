import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { KeyRound, UserRound, ArrowRight, Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import api from '../api';
import { useAlert } from '../context/AlertContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  useEffect(() => {
    if (localStorage.getItem('ches_token')) {
      navigate('/dashboard', { replace: true });
      return;
    }
    const params = new URLSearchParams(location.search);
    if (params.get('verified') === 'true') {
      showAlert('Verifikasi berhasil', 'Email Anda telah berhasil diverifikasi. Silakan login.', 'success');
      window.history.replaceState({}, document.title, '/login');
    }
  }, [location, showAlert, navigate]);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const username = e.target.username.value;
    const password = e.target.password.value;

    try {
      const response = await api.post('/auth/login', { username, password });
      localStorage.setItem('ches_token', response.data.token);
      localStorage.setItem('ches_user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Email, Username, atau Password yang Anda masukkan salah. Silakan cek kembali dan coba login lagi.';
      setError(errorMsg);
      showAlert('Login Gagal', errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-950 transition-colors duration-200">
      {/* Left side - Banner / Graphic */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#b52025] to-[#8c191c] relative items-center justify-center overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_20%_30%,_white_0%,_transparent_50%)]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full border-[20px] border-white/10" />
        <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full border-[40px] border-white/5" />
        
        <div className="z-10 text-center px-12 text-white">
          <div className="bg-white/90 p-4 px-6 rounded-md backdrop-blur-md inline-block mb-8 border border-white/20">
            <img src="https://i.ibb.co.com/prMYS06h/LOGO-2025-03.png" alt="Logo" className="h-12 object-contain" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            CHES Portal
          </h1>
          <p className="text-lg text-white/80 max-w-md mx-auto leading-relaxed">
            Sistem manajemen log alat berat terpadu untuk efisiensi dan transparansi operasional lapangan.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-gray-50/50 dark:bg-gray-950">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-10 text-center lg:text-left">
            <img
              src="https://i.ibb.co.com/prMYS06h/LOGO-2025-03.png"
              alt="Semen Merah Putih Logo"
              className="h-16 object-contain mb-8 mx-auto lg:mx-0 bg-white/10 p-2 rounded-md dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"
            />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Cardlog Heavy Equipment System
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
              Please enter your details to sign in.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Username / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <UserRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="block w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md focus:ring-1 focus:ring-[#b52025] focus:border-[#b52025] transition-colors text-gray-900 dark:text-white"
                  placeholder="Enter your username or email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="block w-full pl-11 pr-12 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md focus:ring-1 focus:ring-[#b52025] focus:border-[#b52025] transition-colors text-gray-900 dark:text-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="text-right mt-2">
                <a href="/forgot-password" onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }} className="text-sm font-semibold text-[#b52025] hover:text-[#8c191c] transition-colors">
                  Lupa Password?
                </a>
              </div>
            </div>

            {/* Removed inline error display in favor of custom popup */}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#b52025] focus:ring-[#b52025] border-gray-300 dark:border-gray-700 rounded cursor-pointer bg-white dark:bg-gray-900"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                  Remember me
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-md text-sm font-bold text-white bg-[#b52025] hover:bg-[#8c191c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b52025] transition-colors disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5 text-white" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
            Belum punya akun? <Link to="/register" className="text-[#b52025] hover:text-[#8c191c]">Daftar di sini</Link>
          </div>
          
          <div className="mt-10 text-center lg:text-left text-xs font-medium text-gray-400 dark:text-gray-600">
            &copy; {new Date().getFullYear()} Semen Merah Putih. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
