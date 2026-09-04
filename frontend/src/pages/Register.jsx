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
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      {/* Mobile Header - Modern Industrial Banner */}
      <div className="lg:hidden w-full bg-[#b52025] relative overflow-hidden py-10 px-6 text-center flex flex-col items-center justify-center shadow-md">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:20px_20px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />
        <div className="z-10 relative bg-white p-3 rounded-xl shadow-lg border border-white/20 mb-4 inline-block">
          <img src="https://i.ibb.co.com/prMYS06h/LOGO-2025-03.png" alt="Semen Merah Putih Logo" className="h-9 object-contain" />
        </div>
        <h1 className="z-10 relative text-2xl font-extrabold text-white tracking-tight">CHES Portal</h1>
        <p className="z-10 relative text-white/80 text-sm mt-1 font-medium">Cardlog Heavy Equipment System</p>
      </div>

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
              Create an<br />Account
            </h1>
            <div className="w-12 h-1.5 bg-white mb-6 rounded-full opacity-90" />
            <p className="text-lg text-white/90 max-w-md leading-relaxed font-medium">
              Bergabunglah dengan platform manajemen log alat berat terpadu untuk operasi yang lebih baik.
            </p>
          </div>
          
          <div className="text-white/70 text-sm font-semibold tracking-wide">
            PT CEMINDO GEMILANG TBK - PLANT BATAM
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-7/12 flex flex-col justify-center px-6 sm:px-16 xl:px-24 relative py-8 lg:py-12 flex-1">
        <div className="w-full max-w-md mx-auto lg:mx-0 xl:ml-16">
          <div className="mb-8 lg:mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              CHES Register
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
              Silakan lengkapi data di bawah ini untuk membuat akun baru.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nama Lengkap</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserCheck className="h-5 w-5 text-gray-400 group-focus-within:text-[#b52025] transition-colors" />
                </div>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="block w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#b52025]/20 focus:border-[#b52025] transition-all text-gray-900 dark:text-white shadow-sm"
                  placeholder="Masukkan nama lengkap"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-[#b52025] transition-colors" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="block w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#b52025]/20 focus:border-[#b52025] transition-all text-gray-900 dark:text-white shadow-sm"
                  placeholder="Masukkan username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-[#b52025] transition-colors" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="block w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#b52025]/20 focus:border-[#b52025] transition-all text-gray-900 dark:text-white shadow-sm"
                  placeholder="Masukkan alamat email aktif"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-[#b52025] transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="block w-full pl-12 pr-12 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#b52025]/20 focus:border-[#b52025] transition-all text-gray-900 dark:text-white shadow-sm"
                  placeholder="Masukkan password"
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
            
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#b52025] hover:bg-[#8c191c] focus:outline-none focus:ring-4 focus:ring-[#b52025]/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed group shadow-md hover:shadow-lg"
            >
              {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
            </button>
          </form>
          
          <div className="mt-8 text-center lg:text-left text-sm font-medium text-gray-600 dark:text-gray-400">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-[#b52025] hover:text-[#8c191c] font-bold">
              Login di sini
            </Link>
          </div>
          
          <div className="mt-8 text-center lg:text-left text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider">
            &copy; {new Date().getFullYear()} Semen Merah Putih
          </div>
        </div>
      </div>
    </div>
  );
}
