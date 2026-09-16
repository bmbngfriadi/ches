import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { KeyRound, UserRound, ArrowRight, Loader2, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import api from '../api';
import { useAlert } from '../context/AlertContext';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useAlert();
  const { theme, toggleTheme } = useTheme();
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
              <span className="hidden lg:inline">Cardlog Heavy<br />Equipment System</span>
            </h1>
            <div className="hidden lg:block w-12 h-1.5 bg-white mb-6 rounded-full opacity-90 shadow-sm" />
            <p className="text-white/90 text-sm lg:text-lg max-w-md leading-relaxed font-medium mx-auto lg:mx-0 drop-shadow-sm">
              <span className="lg:hidden">Cardlog Heavy Equipment System</span>
              <span className="hidden lg:inline">Sistem manajemen log alat berat terpadu untuk efisiensi dan transparansi operasional lapangan.</span>
            </p>
          </div>
          <div className="hidden lg:block mt-auto pt-16 text-white/70 text-sm font-semibold tracking-wide">
            PT CEMINDO GEMILANG TBK - PLANT BATAM
          </div>
        </div>
      </div>

      {/* Right side (Bottom overlapping card on mobile) */}
      <div className="login-right-panel">
        <div className="login-right-content relative">
          
          {/* Dark Mode Toggle */}
          <div className="absolute top-0 right-0 sm:-top-2 sm:-right-2">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-[var(--surface-50)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
              aria-label="Toggle Dark Mode"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          <div className="mb-8 lg:mb-10 text-center lg:text-left mt-2">
            <h2 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Selamat Datang
            </h2>
            <p className="text-[var(--text-secondary)] mt-2 font-medium">
              Silakan login untuk mengakses dashboard operasional.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="username" className="block text-sm font-bold text-[var(--text-primary)] mb-2">
                Username / Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserRound className="h-5 w-5 text-[var(--text-secondary)] group-focus-within:text-[var(--primary-500)] transition-colors" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="block w-full pl-12 pr-4 py-3.5 bg-[var(--surface)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent transition-all text-[var(--text-primary)] shadow-sm"
                  placeholder="Enter your username or email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-[var(--text-primary)] mb-2">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-[var(--text-secondary)] group-focus-within:text-[var(--primary-500)] transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="block w-full pl-12 pr-12 py-3.5 bg-[var(--surface)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent transition-all text-[var(--text-primary)] shadow-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[var(--primary-500)] focus:ring-[var(--primary-500)] border-[var(--border-color)] rounded cursor-pointer bg-[var(--surface)]"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-[var(--text-secondary)] cursor-pointer">
                  Remember me
                </label>
              </div>
              <Link to="/forgot-password" className="text-sm font-semibold text-[var(--primary-500)] hover:text-[var(--primary-700)] transition-colors">
                Lupa Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[var(--primary-500)] hover:bg-[var(--primary-600)] focus:outline-none focus:ring-4 focus:ring-[var(--primary-500)]/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed group shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.23)] hover:-translate-y-0.5"
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
          
          <div className="mt-10 text-center lg:text-left text-sm font-medium text-[var(--text-secondary)]">
            Belum punya akun? <Link to="/register" className="text-[var(--primary-500)] hover:text-[var(--primary-700)] font-bold">Daftar di sini</Link>
          </div>
          
          <div className="mt-8 text-center lg:text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            &copy; {new Date().getFullYear()} Semen Merah Putih
          </div>
        </div>
      </div>
    </div>
  );
}
