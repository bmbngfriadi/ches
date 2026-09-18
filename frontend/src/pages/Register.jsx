import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, UserCheck, Eye, EyeOff } from 'lucide-react';
import api from '../api';
import { useAlert } from '../context/AlertContext';

export default function Register() {
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await api.post('/auth/register', formData);
      showAlert(response.data.message || 'Registrasi berhasil. Silakan cek email Anda.', 'success');
      setTimeout(() => navigate('/login'), 4000);
    } catch (err) {
      console.error(err);
      showAlert(err.response?.data?.message || 'Registrasi gagal. Silakan coba lagi.', 'error');
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
              <span className="hidden lg:inline">Create an<br />Account</span>
            </h1>
            <div className="hidden lg:block w-12 h-1.5 bg-white mb-6 rounded-full opacity-90 shadow-sm" />
            <p className="text-white/90 text-sm lg:text-lg max-w-md leading-relaxed font-medium mx-auto lg:mx-0 drop-shadow-sm">
              <span className="lg:hidden">Cardlog Heavy Equipment System</span>
              <span className="hidden lg:inline">Bergabunglah dengan platform manajemen log alat berat terpadu untuk operasi yang lebih baik.</span>
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
              CHES Register
            </h2>
            <p className="text-[var(--text-secondary)] mt-2 font-medium">
              Silakan lengkapi data di bawah ini untuk membuat akun baru.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Nama Lengkap</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserCheck className="h-5 w-5 text-[var(--text-secondary)] group-focus-within:text-[var(--primary-500)] transition-colors" />
                </div>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="block w-full pl-12 pr-4 py-3 bg-[var(--surface)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent transition-all text-[var(--text-primary)] shadow-sm"
                  placeholder="Masukkan nama lengkap"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-[var(--text-secondary)] group-focus-within:text-[var(--primary-500)] transition-colors" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="block w-full pl-12 pr-4 py-3 bg-[var(--surface)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent transition-all text-[var(--text-primary)] shadow-sm"
                  placeholder="Masukkan username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[var(--text-secondary)] group-focus-within:text-[var(--primary-500)] transition-colors" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="block w-full pl-12 pr-4 py-3 bg-[var(--surface)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent transition-all text-[var(--text-primary)] shadow-sm"
                  placeholder="Masukkan alamat email aktif"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[var(--text-secondary)] group-focus-within:text-[var(--primary-500)] transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="block w-full pl-12 pr-12 py-3 bg-[var(--surface)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent transition-all text-[var(--text-primary)] shadow-sm"
                  placeholder="Masukkan password"
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
            
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 btn-primary group"
            >
              {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
            </button>
          </form>
          
          <div className="mt-8 text-center lg:text-left text-sm font-medium text-[var(--text-secondary)]">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-[var(--primary-500)] hover:text-[var(--primary-700)] font-bold">
              Login di sini
            </Link>
          </div>
          
          <div className="mt-8 text-center lg:text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            &copy; {new Date().getFullYear()} Semen Merah Putih
          </div>
        </div>
      </div>
    </div>
  );
}
