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
    
    const username = e.target.username.value.trim();
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
              Cardlog Heavy<br />Equipment System
            </h1>
            <div className="w-12 h-1.5 bg-white mb-6 rounded-full opacity-90" />
            <p className="text-lg text-white/90 max-w-md leading-relaxed font-medium">
              Sistem manajemen log alat berat terpadu untuk efisiensi dan transparansi operasional lapangan.
            </p>
          </div>
          
          <div className="text-white/70 text-sm font-semibold tracking-wide">
            PT CEMINDO GEMILANG TBK - PLANT BATAM
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-7/12 flex flex-col justify-center px-6 sm:px-16 xl:px-24 relative">
        <div className="w-full max-w-md mx-auto lg:mx-0 xl:ml-16">
          <div className="mb-10 text-center lg:text-left">
            <div className="lg:hidden bg-white p-3 rounded-xl inline-block mb-6 shadow-sm border border-gray-100 dark:bg-gray-900 dark:border-gray-800">
              <img src="https://i.ibb.co.com/prMYS06h/LOGO-2025-03.png" alt="Semen Merah Putih Logo" className="h-10 object-contain" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Welcome Back
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
              Please enter your credentials to sign in.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="username" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Username / Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserRound className="h-5 w-5 text-gray-400 group-focus-within:text-[#b52025] transition-colors" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="block w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#b52025]/20 focus:border-[#b52025] transition-all text-gray-900 dark:text-white shadow-sm"
                  placeholder="Enter your username or email"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <Link to="/forgot-password" className="text-sm font-semibold text-[#b52025] hover:text-[#8c191c] transition-colors">
                  Lupa Password?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400 group-focus-within:text-[#b52025] transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="block w-full pl-12 pr-12 py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#b52025]/20 focus:border-[#b52025] transition-all text-gray-900 dark:text-white shadow-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[#b52025] focus:ring-[#b52025] border-gray-300 dark:border-gray-700 rounded cursor-pointer bg-white dark:bg-gray-900"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer">
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#b52025] hover:bg-[#8c191c] focus:outline-none focus:ring-4 focus:ring-[#b52025]/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed group shadow-md hover:shadow-lg"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5 text-white" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-10 text-center lg:text-left text-sm font-medium text-gray-600 dark:text-gray-400">
            Belum punya akun? <Link to="/register" className="text-[#b52025] hover:text-[#8c191c] font-bold">Daftar di sini</Link>
          </div>
          
          <div className="mt-8 text-center lg:text-left text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider">
            &copy; {new Date().getFullYear()} Semen Merah Putih
          </div>
        </div>
      </div>
    </div>
  );
}
