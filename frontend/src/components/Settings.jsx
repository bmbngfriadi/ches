import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Save, X, ZoomIn, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import api from '../api';
import { useAlert } from '../context/AlertContext';
import { compressImage } from '../utils/imageCompressor';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg');
}

export default function Settings() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('ches_user') || '{}');
  const [password, setPassword] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(currentUser.profile_photo || '');
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  // Photo Preview & Crop States
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const executeLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) { // 15MB limit
        showAlert('Ukuran file terlalu besar (maksimal 15MB)', 'error');
        return;
      }
      try {
        // Compress profile photo to 50KB and 300px width
        const compressedBase64 = await compressImage(file, 0.05, 300);
        setImageToCrop(compressedBase64);
        setShowPreviewModal(false); // Close preview if open
      } catch (err) {
        console.error('Error compressing image:', err);
        showAlert('Gagal memproses foto', 'error');
      }
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApplyCrop = async () => {
    try {
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      setProfilePhoto(croppedImage);
      setImageToCrop(null);
    } catch (e) {
      console.error(e);
      showAlert('Gagal memotong gambar', 'error');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    showAlert(
      'Konfirmasi Simpan',
      'Apakah Anda yakin ingin menyimpan perubahan profil dan kata sandi ini?',
      'confirm',
      async () => {
        setLoading(true);
        try {
          await api.put('/users/profile/update', {
            password: password || undefined,
            profile_photo: profilePhoto || undefined
          });
          
          // Update local storage
          const updatedUser = { ...currentUser, profile_photo: profilePhoto };
          localStorage.setItem('ches_user', JSON.stringify(updatedUser));
          
          // Dispatch custom event so Dashboard can update instantly
          window.dispatchEvent(new Event('profileUpdated'));
          
          showAlert('Sukses!', 'Profil berhasil diperbarui!', 'success');
          setPassword('');
        } catch (err) {
          showAlert('Gagal!', 'Gagal memperbarui profil', 'error');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">Profile</h1>
        <p className="text-sm text-[var(--text-secondary)] font-medium mt-1">Ubah foto profil dan kata sandi Anda di sini.</p>
      </div>

      <div className="bg-[var(--surface)] rounded-2xl p-6 md:p-8 border border-[var(--border-color)] shadow-sm">
        <form onSubmit={handleSave} className="space-y-8">
          <div className="flex flex-col sm:flex-row gap-8 md:gap-10">
            {/* Photo Section */}
            <div className="flex flex-col items-center space-y-4">
              <div 
                onClick={() => { if (profilePhoto) setShowPreviewModal(true); }}
                className="relative w-36 h-36 rounded-full border-4 border-[var(--border-color)] overflow-hidden bg-[var(--surface-50)] flex items-center justify-center group cursor-pointer shadow-sm transition-transform hover:scale-[1.02]"
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl font-black text-[var(--text-secondary)]/50">
                    {(currentUser.full_name || currentUser.username || 'AD').substring(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                  <ZoomIn className="w-6 h-6 text-white mb-1" />
                  <span className="text-xs text-white font-bold">{profilePhoto ? 'Lihat Foto' : 'Pilih Foto'}</span>
                </div>
                {!profilePhoto && <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handlePhotoSelect} />}
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-semibold bg-[var(--surface-50)] px-3 py-1.5 rounded-full border border-[var(--border-color)]">
                Klik untuk {profilePhoto ? 'lihat / ubah' : 'unggah'} foto.
              </p>
            </div>

            {/* User Details Form */}
            <div className="flex-1 space-y-5">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Username</label>
                <input disabled type="text" value={currentUser.username || ''} className="w-full px-4 py-3 bg-[var(--surface-50)] border border-[var(--border-color)] rounded-xl text-[var(--text-secondary)] font-medium cursor-not-allowed opacity-70" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Nama Lengkap</label>
                <input disabled type="text" value={currentUser.full_name || ''} className="w-full px-4 py-3 bg-[var(--surface-50)] border border-[var(--border-color)] rounded-xl text-[var(--text-secondary)] font-medium cursor-not-allowed opacity-70" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Email</label>
                <input disabled type="text" value={currentUser.email || '-'} className="w-full px-4 py-3 bg-[var(--surface-50)] border border-[var(--border-color)] rounded-xl text-[var(--text-secondary)] font-medium cursor-not-allowed opacity-70" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Role</label>
                <input disabled type="text" value={currentUser.role ? currentUser.role.toUpperCase() : ''} className="w-full px-4 py-3 bg-[var(--surface-50)] border border-[var(--border-color)] rounded-xl text-[var(--text-secondary)] font-bold cursor-not-allowed opacity-70" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Password Baru</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kosongkan jika tidak ingin mengubah sandi" 
                  className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]/30 focus:border-[var(--primary-500)] transition-all shadow-sm" 
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 pt-6 border-t border-[var(--border-color)]">
            <button 
              type="button" 
              onClick={() => setShowLogoutConfirm(true)}
              className="flex justify-center items-center px-6 py-3.5 sm:py-3 w-full sm:w-auto bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-base sm:text-sm"
            >
              <LogOut className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
              Sign Out
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex justify-center items-center px-8 py-3.5 sm:px-6 sm:py-3 w-full sm:w-auto bg-[var(--primary-500)] text-white rounded-xl font-bold hover:bg-[var(--primary-600)] transition-all disabled:opacity-70 disabled:cursor-not-allowed text-base sm:text-sm shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.23)] hover:-translate-y-0.5 active:translate-y-0"
            >
              <Save className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>

      {/* Profile Photo Preview Modal */}
      {showPreviewModal && createPortal(
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md" onClick={() => setShowPreviewModal(false)} />
          <div className="relative bg-[var(--surface)] rounded-t-[32px] sm:rounded-2xl overflow-hidden shadow-2xl border border-[var(--border-color)] max-w-md w-full animate-slide-up-sheet sm:animate-in sm:fade-in sm:zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-[var(--border-color)]">
              <h3 className="font-extrabold text-[var(--text-primary)]">Foto Profil</h3>
              <button onClick={() => setShowPreviewModal(false)} className="p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 flex justify-center bg-[var(--surface-50)]">
              <img src={profilePhoto} alt="Profile Preview" className="w-64 h-64 rounded-full object-cover shadow-xl border-4 border-[var(--surface)]" />
            </div>
            <div className="p-5 sm:pb-5 pb-8 bg-[var(--surface)] border-t border-[var(--border-color)] flex justify-end space-x-3">
              <label className="flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-[var(--primary-500)] hover:bg-[var(--primary-600)] text-white rounded-full sm:rounded-xl font-bold cursor-pointer transition-colors shadow-[0_4px_14px_0_rgba(225,29,72,0.39)]">
                <Camera className="w-4 h-4 mr-2" />
                Ganti Foto
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
              </label>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Cropper Modal */}
      {imageToCrop && createPortal(
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-md" onClick={() => setImageToCrop(null)} />
          <div className="relative bg-[var(--surface)] rounded-t-[32px] sm:rounded-2xl overflow-hidden shadow-2xl border border-[var(--border-color)] w-full max-w-lg flex flex-col animate-slide-up-sheet sm:animate-in sm:fade-in sm:zoom-in duration-200">
            <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--surface)] z-10">
              <h3 className="font-extrabold text-[var(--text-primary)]">Sesuaikan Foto</h3>
              <button onClick={() => setImageToCrop(null)} className="p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative h-96 w-full bg-black">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="p-5 bg-[var(--surface)] border-t border-[var(--border-color)] flex items-center space-x-4">
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(e.target.value)}
                className="w-full h-2 bg-[var(--border-color)] rounded-lg appearance-none cursor-pointer accent-[var(--primary-500)]"
              />
              <button
                onClick={handleApplyCrop}
                className="px-8 py-3.5 sm:px-6 sm:py-3 bg-[var(--primary-500)] hover:bg-[var(--primary-600)] text-white rounded-xl font-bold shrink-0 transition-colors text-base sm:text-sm shadow-[0_4px_14px_0_rgba(225,29,72,0.39)]"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && createPortal(
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative bg-[var(--surface)] rounded-t-[32px] sm:rounded-2xl shadow-2xl border border-[var(--border-color)] w-full max-w-md p-7 pb-10 sm:pb-7 animate-slide-up-sheet sm:animate-in sm:fade-in sm:zoom-in duration-200">
            <button onClick={() => setShowLogoutConfirm(false)} className="absolute top-5 right-5 p-2 rounded-full bg-[var(--surface-50)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-colors border border-[var(--border-color)]">
              <X className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-5 border border-red-100 dark:border-red-900/30">
              <LogOut className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-xl font-extrabold text-[var(--text-primary)] mb-2 tracking-tight">Konfirmasi Logout</h3>
            <p className="text-[var(--text-secondary)] mb-8 leading-relaxed font-medium">
              Apakah Anda yakin ingin keluar dari sistem? Anda harus login kembali untuk mengakses data.
            </p>
            <div className="flex flex-col-reverse sm:flex-row sm:space-x-3 gap-3 sm:gap-0 mt-2">
              <button 
                onClick={() => setShowLogoutConfirm(false)} 
                className="w-full sm:flex-1 px-4 py-3.5 bg-[var(--surface-50)] hover:bg-[var(--surface-hover)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-full sm:rounded-xl font-bold text-sm transition-all focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800"
              >
                Batal
              </button>
              <button 
                onClick={executeLogout} 
                className="w-full sm:flex-1 px-4 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-full sm:rounded-xl font-bold text-sm transition-all shadow-[0_4px_14px_0_rgba(220,38,38,0.39)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.23)] hover:-translate-y-0.5 focus:ring-4 focus:ring-red-600/30"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
