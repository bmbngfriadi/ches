import React, { useState, useCallback } from 'react';
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
        // Compress profile photo to 100KB and 400px width
        const compressedBase64 = await compressImage(file, 0.1, 400);
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Ubah foto profil dan kata sandi Anda di sini.</p>
      </div>

      <div className="bg-white dark:bg-gray-950 rounded-md p-6 border border-gray-200 dark:border-gray-800">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-8">
            {/* Photo Section */}
            <div className="flex flex-col items-center space-y-4">
              <div 
                onClick={() => { if (profilePhoto) setShowPreviewModal(true); }}
                className="relative w-32 h-32 rounded-full border border-gray-200 dark:border-gray-800 overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center group cursor-pointer"
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-gray-400">
                    {(currentUser.full_name || currentUser.username || 'AD').substring(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="w-6 h-6 text-white mb-1" />
                  <span className="text-xs text-white font-bold">{profilePhoto ? 'Lihat Foto' : 'Pilih Foto'}</span>
                </div>
                {!profilePhoto && <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handlePhotoSelect} />}
              </div>
              <p className="text-xs text-gray-500 font-medium">Klik untuk {profilePhoto ? 'lihat / ubah' : 'unggah'} foto.</p>
            </div>

            {/* User Details Form */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Username</label>
                <input disabled type="text" value={currentUser.username || ''} className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-md text-gray-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nama Lengkap</label>
                <input disabled type="text" value={currentUser.full_name || ''} className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-md text-gray-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input disabled type="text" value={currentUser.email || '-'} className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-md text-gray-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <input disabled type="text" value={currentUser.role ? currentUser.role.toUpperCase() : ''} className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-md text-gray-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Password Baru</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kosongkan jika tidak ingin mengubah sandi" 
                  className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-white focus:outline-none focus:border-[#b52025] focus:ring-1 focus:ring-[#b52025]" 
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button 
              type="button" 
              onClick={() => setShowLogoutConfirm(true)}
              className="flex justify-center items-center px-6 py-3.5 sm:px-4 sm:py-2.5 w-full sm:w-auto bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-md font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-base sm:text-sm"
            >
              <LogOut className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
              Sign Out
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex justify-center items-center px-8 py-3.5 sm:px-6 sm:py-2.5 w-full sm:w-auto bg-[#b52025] text-white rounded-md font-bold hover:bg-[#8c191c] transition-colors disabled:opacity-70 disabled:cursor-not-allowed text-base sm:text-sm"
            >
              <Save className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>

      {/* Profile Photo Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setShowPreviewModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-md overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-white">Foto Profil</h3>
              <button onClick={() => setShowPreviewModal(false)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 flex justify-center bg-gray-50 dark:bg-gray-950">
              <img src={profilePhoto} alt="Profile Preview" className="w-64 h-64 rounded-full object-cover shadow-lg border-4 border-white dark:border-gray-800" />
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex justify-end space-x-3">
              <label className="flex items-center justify-center px-5 py-2.5 bg-[#b52025] hover:bg-[#8c191c] text-white rounded-md font-bold cursor-pointer transition-colors">
                <Camera className="w-4 h-4 mr-2" />
                Ganti Foto
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Cropper Modal */}
      {imageToCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-md" onClick={() => setImageToCrop(null)} />
          <div className="relative bg-white dark:bg-gray-950 rounded-md overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 w-full max-w-lg flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 z-10">
              <h3 className="font-bold text-gray-900 dark:text-white">Sesuaikan Foto</h3>
              <button onClick={() => setImageToCrop(null)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
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
            
            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center space-x-4">
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-[#b52025]"
              />
              <button
                onClick={handleApplyCrop}
                className="px-8 py-3.5 sm:px-6 sm:py-2 bg-[#b52025] hover:bg-[#8c191c] text-white rounded-md font-bold shrink-0 transition-colors text-base sm:text-sm"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-md shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center space-x-3 text-[#b52025] mb-4">
              <LogOut className="w-6 h-6" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Konfirmasi Logout</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Apakah Anda yakin ingin keluar? Anda harus memasukkan username dan password untuk login kembali ke sistem.
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)} 
                className="flex-1 px-4 py-3.5 sm:py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md font-bold text-base sm:text-sm transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={executeLogout} 
                className="flex-1 px-4 py-3.5 sm:py-2.5 bg-[#b52025] hover:bg-[#8c191c] text-white rounded-md font-bold text-base sm:text-sm transition-colors"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
