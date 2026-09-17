import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, ArrowLeft, Save, Camera, Edit2, X, FileText, Download, Share2 } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import { toPng } from 'html-to-image';
import ExportPngTemplate from '../components/ExportPngTemplate';
import { compressImage } from '../utils/imageCompressor';

const CHECKLIST_ITEMS = [
  'Lampu Depan', 'Lampu Belakang', 'Ban Depan', 'Ban Belakang',
  'Klakson', 'Alarm Mundur', 'Rem Jalan', 'Rem Parkir',
  'Sabuk Pengaman', 'Kebersihan'
];
const CHECKLIST_OPTIONS = ['Baik', 'Rusak', 'Error', 'Others'];

export default function CardlogForm({ onClose, initialData, isReadOnly, onEdit }) {
  const { showAlert, closeAlert } = useAlert();

  const currentUser = JSON.parse(localStorage.getItem('ches_user') || '{}');
  const isAdmin = currentUser.role === 'administrator/dev';
  const permissions = currentUser.permissions || [];

  const has1hEdit = permissions.includes('cardlog_edit_1h');
  const hasUnlimitedEdit = permissions.includes('cardlog_edit');
  const canEditAny = isAdmin || (hasUnlimitedEdit && !has1hEdit);
  const canEdit1h = !isAdmin && has1hEdit;
  const canExportPng = isAdmin || permissions.includes('cardlog_export_png');

  const exportRef = useRef(null);

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [exportedImage, setExportedImage] = useState(null);
  const [exportedBlob, setExportedBlob] = useState(null);
  const [exportFilename, setExportFilename] = useState('');
  const [formData, setFormData] = useState({
    date: initialData ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    shift: initialData ? initialData.shift_no : 'Shift 1',
    operator: initialData ? initialData.operator : '',
    unitNo: initialData ? initialData.unit_no : ''
  });

  const [checklists, setChecklists] = useState(
    CHECKLIST_ITEMS.reduce((acc, item) => {
      let status = 'Baik';
      let notes = '';
      if (initialData) {
        const dbKey = item.toLowerCase().replace(' ', '_');
        const val = initialData[dbKey];
        if (val && !['Baik', 'Rusak', 'Error'].includes(val)) {
          status = 'Others';
          notes = val;
        } else if (val) {
          status = val;
        }
      }
      acc[item] = { status, notes };
      return acc;
    }, {})
  );

  const [operasional, setOperasional] = useState({
    hmAwal: initialData ? initialData.hm_awal : '',
    hmAkhir: initialData ? initialData.hm_akhir : '',
    odoAwal: initialData ? initialData.odometer_awal : '',
    odoAkhir: initialData ? initialData.odometer_akhir : '',
    chargingMulai: initialData ? initialData.charging_mulai || '' : '',
    chargingSelesai: initialData ? initialData.charging_selesai || '' : '',
    chargingTotal: initialData ? initialData.charging_durasi || 0 : 0
  });

  let isEditable = false;
  if (initialData) {
    isEditable = canEditAny;
    if (!isEditable && canEdit1h && initialData.age_minutes !== undefined) {
      if (parseFloat(initialData.age_minutes) <= 60 && parseFloat(initialData.age_minutes) >= 0) {
        isEditable = true;
      }
    }
  } else {
    isEditable = true; // New cardlog
  }

  const [odometerPhoto, setOdometerPhoto] = useState(initialData ? (initialData.odometer_photo || '') : '');

  const [activities, setActivities] = useState([
    { id: Date.now(), jamMulai: '', jamSelesai: '', deskripsi: '' }
  ]);

  // Fetch activities if editing
  useEffect(() => {
    if (initialData) {
      const fetchActivities = async () => {
        try {
          const api = (await import('../api')).default;
          const res = await api.get(`/cardlogs/${initialData.id}/activities`);
          if (res.data && res.data.length > 0) {
            setActivities(res.data.map(act => ({
              id: act.id,
              jamMulai: act.jam_mulai.substring(0, 5),
              jamSelesai: act.jam_selesai.substring(0, 5),
              deskripsi: act.deskripsi
            })));
          }
        } catch (err) {
          console.error('Failed to fetch activities:', err);
        }
      };
      fetchActivities();
    }
  }, [initialData]);

  // Set global dirty flag for hardware back button trap
  useEffect(() => {
    if (!isReadOnly) {
      window.isFormDirty = true;
    } else {
      window.isFormDirty = false;
    }
    return () => {
      window.isFormDirty = false;
    };
  }, [isReadOnly]);

  // Prevent body scroll when photo modal is open
  useEffect(() => {
    if (showPhotoModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showPhotoModal]);

  // Prevent body scroll when export modal is open
  useEffect(() => {
    if (exportedImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [exportedImage]);

  const handleCancelClick = () => {
    if (!isReadOnly) {
      showAlert(
        'Konfirmasi Batal',
        'Anda sedang mengisi data laporan. Apakah Anda yakin ingin membatalkan? Data yang belum disimpan akan hilang.',
        'confirm',
        () => {
          window.isFormDirty = false;
          onClose();
        }
      );
    } else {
      onClose();
    }
  };

  // Fetch last operasional data when unitNo changes
  useEffect(() => {
    const fetchLastOperasional = async () => {
      if (!formData.unitNo || initialData) return; // Skip auto-fill when editing
      try {
        const api = (await import('../api')).default;
        const response = await api.get(`/cardlogs/last-operasional/${formData.unitNo}`);
        const data = response.data;
        if (data && (data.hm_akhir !== undefined || data.odometer_akhir !== undefined)) {
          setOperasional(prev => ({
            ...prev,
            hmAwal: data.hm_akhir || '',
            odoAwal: data.odometer_akhir || ''
          }));
        }
      } catch (err) {
        console.error('Error fetching last operasional:', err);
      }
    };
    fetchLastOperasional();
  }, [formData.unitNo]);

  // Calculate charging duration automatically
  useEffect(() => {
    if (operasional.chargingMulai && operasional.chargingSelesai) {
      const [startHour, startMin] = operasional.chargingMulai.split(':').map(Number);
      const [endHour, endMin] = operasional.chargingSelesai.split(':').map(Number);

      let diffHours = endHour - startHour;
      let diffMins = endMin - startMin;

      if (diffMins < 0) {
        diffHours -= 1;
        diffMins += 60;
      }
      if (diffHours < 0) {
        diffHours += 24; // Handle cross-midnight charging
      }

      const totalHours = diffHours + (diffMins / 60);
      setOperasional(prev => ({ ...prev, chargingTotal: totalHours.toFixed(2) }));
    } else {
      setOperasional(prev => ({ ...prev, chargingTotal: 0 }));
    }
  }, [operasional.chargingMulai, operasional.chargingSelesai]);


  const handleChecklistChange = (item, field, value) => {
    setChecklists(prev => ({
      ...prev,
      [item]: { ...prev[item], [field]: value }
    }));
  };

  const handleOperasionalChange = (field, value) => {
    setOperasional(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleActivityChange = (id, field, value) => {
    setActivities(prev => prev.map(act =>
      act.id === id ? { ...act, [field]: value } : act
    ));
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) { // Hard limit 15MB
        showAlert('Ukuran file terlalu besar (maksimal 15MB)', 'error');
        return;
      }
      try {
        // Compress to 150KB and 600px width max to save VPS bandwidth
        const compressedBase64 = await compressImage(file, 0.15, 600);
        setOdometerPhoto(compressedBase64);
      } catch (err) {
        console.error('Error compressing image:', err);
        showAlert('Gagal memproses foto', 'error');
      }
    }
  };

  const addActivity = () => {
    setActivities(prev => [
      ...prev,
      { id: Date.now(), jamMulai: '', jamSelesai: '', deskripsi: '' }
    ]);
  };

  const removeActivity = (id) => {
    if (activities.length > 1) {
      setActivities(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isReadOnly && !odometerPhoto) {
      return showAlert('Peringatan', 'Foto Odometer wajib diisi', 'warning');
    }

    showAlert(
      'Konfirmasi Simpan',
      'Apakah Anda yakin data laporan ini sudah benar dan ingin menyimpannya?',
      'confirm',
      async () => {
        try {
          const api = (await import('../api')).default;
          const payload = {
            date: formData.date,
            shift: formData.shift,
            operator: formData.operator,
            unitNo: formData.unitNo,
            checklists: checklists,
            operasional: {
              ...operasional,
              charging: operasional.chargingTotal
            },
            activities: activities.map(k => ({
              jamMulai: k.jamMulai,
              jamSelesai: k.jamSelesai,
              deskripsi: k.deskripsi
            })),
            odometerPhoto: odometerPhoto
          };

          if (initialData) {
            await api.put(`/cardlogs/${initialData.id}`, payload);
            showAlert('Sukses!', 'Cardlog berhasil diupdate!', 'success');
          } else {
            await api.post('/cardlogs', payload);
            showAlert('Sukses!', 'Cardlog berhasil disimpan!', 'success');
          }
          if (onClose) onClose();
        } catch (err) {
          console.error('Error submitting cardlog:', err);
          showAlert('Gagal!', err.response?.data?.message || err.message || 'Gagal menyimpan cardlog.', 'error');
        }
      }
    );
  };

  const handleExportPNGConfirm = () => {
    showAlert(
      'Export PNG',
      'Export laporan ini menjadi format PNG?',
      'confirm',
      () => handleExportPNG()
    );
  };

  const handleEditConfirm = () => {
    showAlert(
      'Konfirmasi Edit',
      'Apakah Anda ingin masuk ke mode edit untuk laporan ini?',
      'confirm',
      () => {
        if (onEdit) onEdit();
      }
    );
  };

  const handleExportPNG = async () => {
    if (exportRef.current) {
      showAlert('Memproses...', 'Sedang membuat gambar PNG, mohon tunggu...', 'loading');
      
      try {
        // FIX: For iOS Safari, external image URLs fail to render in html-to-image due to CORS/canvas tainting.
        // We MUST convert the image to a Base64 Data URI before taking the snapshot.
        if (odometerPhoto && !odometerPhoto.startsWith('data:')) {
          try {
            const res = await fetch(odometerPhoto, { cache: 'no-cache' });
            const blob = await res.blob();
            // Load image and compress it to bypass iOS Safari SVG size limits
            const dataUrl = await new Promise((resolve, reject) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_DIM = 1000;
                
                if (width > height && width > MAX_DIM) {
                  height = Math.round((height * MAX_DIM) / width);
                  width = MAX_DIM;
                } else if (height > width && height > MAX_DIM) {
                  width = Math.round((width * MAX_DIM) / height);
                  height = MAX_DIM;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                // Export as JPEG with 0.7 quality to ensure small base64 string
                resolve(canvas.toDataURL('image/jpeg', 0.7));
              };
              img.onerror = () => reject(new Error('Image load failed'));
              img.src = URL.createObjectURL(blob);
            });
            
            // Update React state directly so the DOM re-renders with the optimized Base64 image
            setOdometerPhoto(dataUrl);
            // Wait for React to finish rendering the new image
            await new Promise(r => setTimeout(r, 600));
          } catch(e) {
            console.warn("Gagal konversi foto ke base64", e);
          }
        }
      } catch (e) {
        console.error(e);
      }

      setTimeout(async () => {
        try {
          const { toPng } = await import('html-to-image');
          const dataUrl = await toPng(exportRef.current, {
            backgroundColor: '#ffffff',
            pixelRatio: 2,
            skipFonts: true,
            style: { margin: '0' } // Ensure no weird offsets
          });
          
          // Convert Data URL to Blob immediately for iOS compatibility
          const arr = dataUrl.split(',');
          const mime = arr[0].match(/:(.*?);/)[1];
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while(n--){
              u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], {type: mime});
          const blobUrl = URL.createObjectURL(blob);

          setExportedBlob(blob);
          setExportedImage(blobUrl);
          setExportFilename(`Cardlog_${initialData?.id || 'New'}_${formData.unitNo}.png`);
          if (closeAlert) closeAlert();
        } catch (err) {
          console.error('Error exporting PNG:', err);
          showAlert('Gagal', 'Terjadi kesalahan: ' + (err.message || err.toString()), 'error');
        }
      }, 300);
    }
  };

  const handleShareConfirm = () => {
    showAlert(
      'Bagikan File',
      'Lanjutkan untuk membagikan gambar ini?',
      'confirm',
      () => handleShare()
    );
  };

  const handleShare = async () => {
    try {
      const file = new File([exportedBlob], exportFilename, {type: exportedBlob.type});
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: exportFilename,
          text: 'Laporan Cardlog'
        });
        setExportedImage(null);
        setExportedBlob(null);
      } else {
        // Close modal first so alert is visible
        setExportedImage(null);
        setTimeout(() => showAlert('Pemberitahuan', 'Fitur Bagikan otomatis memerlukan koneksi aman (HTTPS). Karena Anda menggunakan akses IP lokal (HTTP), fitur ini dimatikan oleh browser.', 'info'), 300);
      }
    } catch (e) {
      console.log('Share failed or cancelled', e);
    }
  };

  const handleDownloadConfirm = () => {
    showAlert(
      'Download File',
      'Download file PNG ini ke perangkat Anda?',
      'confirm',
      () => handleDownload()
    );
  };

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      const uniqueName = exportFilename.endsWith('.png') 
        ? exportFilename.replace('.png', `_${Date.now()}.png`)
        : `${exportFilename}_${Date.now()}.png`;
      link.download = uniqueName;
      link.href = exportedImage;
      
      // Show alert immediately to guarantee it renders
      showAlert('Berhasil!', 'File PNG berhasil didownload ke perangkat Anda.', 'success');
      setExportedImage(null);
      setExportedBlob(null);
      
      // Trigger click slightly after to avoid interrupting React render cycle on mobile
      setTimeout(() => {
        link.click();
      }, 500);
      
    } catch (err) {
      showAlert('Gagal!', 'Terjadi kesalahan saat mendownload file.', 'error');
    }
  };

  const inputClass = "mt-1 block w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface-50)] px-4 py-3 text-[var(--text-primary)] focus:border-transparent focus:ring-2 focus:ring-[var(--primary-500)]/30 focus:outline-none transition-all duration-200 sm:text-sm shadow-sm";
  const selectClass = "mt-1 block w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface-50)] px-4 py-3 text-[var(--text-primary)] focus:border-transparent focus:ring-2 focus:ring-[var(--primary-500)]/30 focus:outline-none transition-all duration-200 sm:text-sm appearance-none shadow-sm";

  return (
    <div className="max-w-4xl mx-auto py-2 px-2 sm:px-0">
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={onClose}
          className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] rounded-xl border border-[var(--border-color)] transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{isReadOnly ? 'View Cardlog' : (initialData ? 'Edit Cardlog' : 'New Cardlog')}</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Isi laporan operasional unit heavy equipment.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="bg-[var(--surface)] rounded-2xl p-6 sm:p-8 border border-[var(--border-color)] flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary-500)]/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight uppercase flex items-center">
              <span className="bg-[var(--primary-500)] text-white p-2 rounded-xl mr-3 shadow-sm">
                <FileText className="w-5 h-5" />
              </span>
              {initialData ? (isReadOnly ? 'View Cardlog' : 'Edit Cardlog') : 'Formulir Cardlog Baru'}
            </h2>
            <p className="text-sm font-medium text-[var(--text-secondary)] mt-3">
              Lengkapi data pemeriksaan awal, akhir, dan operasional unit
            </p>
            {initialData && initialData.created_at && (
              <p className="text-xs font-bold text-[var(--text-secondary)] opacity-70 mt-2">
                Disubmit pada: {new Date(initialData.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            )}
          </div>
        </div>

        <div className="bg-[var(--surface)] rounded-2xl p-6 sm:p-8 border border-[var(--border-color)] overflow-hidden w-full shadow-sm">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6 flex items-center tracking-tight">
            <span className="bg-[var(--surface-hover)] text-[var(--primary-600)] dark:text-[var(--primary-400)] w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm border border-[var(--border-color)] shadow-sm font-black">1</span>
            Data Header
          </h2>
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-6 w-full">
            <div className="w-full min-w-0">
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Hari, Tanggal</label>
              <input 
                type="date" 
                required 
                disabled={isReadOnly} 
                className={inputClass} 
                value={formData.date} 
                onChange={e => setFormData({ ...formData, date: e.target.value })} 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Shift No</label>
              <select className={selectClass} disabled={isReadOnly} value={formData.shift} onChange={e => setFormData({ ...formData, shift: e.target.value })}>
                <option value="Shift 1">Shift 01 (00:00 - 08:00)</option>
                <option value="Shift 2">Shift 02 (08:00 - 16:00)</option>
                <option value="Shift 3">Shift 03 (16:00 - 00:00)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Operator</label>
              <input type="text" required placeholder="Nama Operator" disabled={isReadOnly} className={inputClass} value={formData.operator} onChange={e => setFormData({ ...formData, operator: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Nomor Unit</label>
              <select required className={selectClass} disabled={isReadOnly} value={formData.unitNo} onChange={e => setFormData({ ...formData, unitNo: e.target.value })}>
                <option value="">-- Pilih Unit --</option>
                <option>F.01</option>
                <option>F.02</option>
                <option>F.03</option>
                <option>F.04</option>
                <option>F.05</option>
              </select>
            </div>
          </div>
        </div>

        {/* Item Checklist */}
        <div className="bg-[var(--surface)] rounded-2xl p-6 sm:p-8 border border-[var(--border-color)] overflow-hidden w-full shadow-sm">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6 flex items-center tracking-tight">
            <span className="bg-[var(--surface-hover)] text-[var(--primary-600)] dark:text-[var(--primary-400)] w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm border border-[var(--border-color)] shadow-sm font-black">2</span>
            Item Checklist
          </h2>
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-y-6 gap-x-8 w-full">
            {CHECKLIST_ITEMS.map((item) => (
              <div key={item} className="flex flex-col border-b border-[var(--border-color)] pb-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-[var(--text-primary)]">{item}</label>
                  <select
                    disabled={isReadOnly}
                    className="ml-4 rounded-xl border border-[var(--border-color)] bg-[var(--surface-50)] text-sm font-bold py-2 px-3 focus:ring-2 focus:ring-[var(--primary-500)]/30 focus:border-transparent text-[var(--text-primary)] outline-none w-32 appearance-none shadow-sm transition-all"
                    value={checklists[item].status}
                    onChange={(e) => handleChecklistChange(item, 'status', e.target.value)}
                  >
                    {CHECKLIST_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                  </select>
                </div>
                {checklists[item].status === 'Others' && (
                  <div className="mt-3">
                    <input
                      type="text"
                      required
                      disabled={isReadOnly}
                      placeholder="Masukkan detail keterangan (wajib diisi)..."
                      className="w-full text-sm rounded-xl border border-[var(--border-color)] bg-[var(--surface-50)] px-3 py-2.5 text-[var(--text-primary)] focus:border-transparent focus:ring-2 focus:ring-[var(--primary-500)]/30 focus:outline-none transition-all shadow-inner"
                      value={checklists[item].notes}
                      onChange={(e) => handleChecklistChange(item, 'notes', e.target.value)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Operasional Unit */}
        <div className="bg-[var(--surface)] rounded-2xl p-6 sm:p-8 border border-[var(--border-color)] overflow-hidden w-full shadow-sm">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6 flex items-center tracking-tight">
            <span className="bg-[var(--surface-hover)] text-[var(--primary-600)] dark:text-[var(--primary-400)] w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm border border-[var(--border-color)] shadow-sm font-black">3</span>
            Operasional Unit
          </h2>
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-6 w-full">
            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">HM Awal</label>
              <input type="number" required disabled={isReadOnly} placeholder="0.00" step="0.01" className={inputClass} value={operasional.hmAwal} onChange={e => handleOperasionalChange('hmAwal', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">HM Akhir</label>
              <input type="number" required disabled={isReadOnly} placeholder="0.00" step="0.01" className={inputClass} value={operasional.hmAkhir} onChange={e => handleOperasionalChange('hmAkhir', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Odometer Awal</label>
              <input type="number" required disabled={isReadOnly} placeholder="0.00" step="0.01" className={inputClass} value={operasional.odoAwal} onChange={e => handleOperasionalChange('odoAwal', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Odometer Akhir</label>
              <input type="number" required disabled={isReadOnly} placeholder="0.00" step="0.01" className={inputClass} value={operasional.odoAkhir} onChange={e => handleOperasionalChange('odoAkhir', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Durasi Charging</label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1 tracking-wider">Mulai</label>
                  <input type="time" disabled={isReadOnly} className={inputClass} value={operasional.chargingMulai} onChange={e => handleOperasionalChange('chargingMulai', e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1 tracking-wider">Selesai</label>
                  <input type="time" disabled={isReadOnly} className={inputClass} value={operasional.chargingSelesai} onChange={e => handleOperasionalChange('chargingSelesai', e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1 tracking-wider">Total (Jam)</label>
                  <input type="text" readOnly className={`${inputClass} bg-[var(--surface-50)] font-black text-[var(--primary-600)] dark:text-[var(--primary-400)] border-[var(--border-color)] cursor-not-allowed`} value={operasional.chargingTotal} />
                </div>
              </div>
            </div>

            <div className="sm:col-span-2 pt-6 border-t border-[var(--border-color)]">
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-3">Foto Odometer <span className="text-red-500">*</span></label>
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="w-full sm:w-1/3 flex flex-col gap-3">
                  <div className="aspect-video bg-[var(--surface-50)] border-2 border-dashed border-[var(--border-color)] rounded-xl flex items-center justify-center overflow-hidden relative shadow-inner">
                    {odometerPhoto ? (
                      <img src={odometerPhoto} alt="Odometer" className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300" onClick={() => setShowPhotoModal(true)} />
                    ) : (
                      <div className="text-center p-4">
                        <Camera className="w-8 h-8 text-[var(--text-secondary)] mx-auto mb-2 opacity-70" />
                        <span className="text-xs text-[var(--text-secondary)] font-bold">Foto (Auto-Compress)</span>
                      </div>
                    )}
                  </div>

                  {!isReadOnly && (
                    <div className="flex gap-2">
                      <label className="flex-1 cursor-pointer flex items-center justify-center text-xs font-bold text-white bg-[var(--primary-500)] hover:bg-[var(--primary-600)] py-2.5 px-2 rounded-xl shadow-[0_4px_10px_rgba(225,29,72,0.3)] transition-all text-center">
                        Buka Kamera
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
                      </label>
                      <label className="flex-1 cursor-pointer flex items-center justify-center text-xs font-bold text-[var(--text-primary)] bg-[var(--surface)] border border-[var(--border-color)] hover:bg-[var(--surface-hover)] py-2.5 px-2 rounded-xl shadow-sm transition-all text-center">
                        Pilih Galeri
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                      </label>
                    </div>
                  )}
                </div>
                <div className="flex-1 bg-[var(--primary-50)] dark:bg-[var(--primary-500)]/5 border border-[var(--primary-500)]/20 p-4 rounded-xl">
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-2">
                    Unggah foto yang jelas menunjukkan angka Hour Meter (HM) atau Odometer terakhir pada unit. Pastikan angka dapat terbaca dengan baik.
                  </p>
                  <p className="text-sm font-bold text-[var(--primary-600)] dark:text-[var(--primary-400)]">Wajib diisi untuk memvalidasi angka HM/Odometer.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Laporan Kegiatan */}
        <div className="bg-[var(--surface)] rounded-2xl p-6 sm:p-8 border border-[var(--border-color)] shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center tracking-tight">
              <span className="bg-[var(--surface-hover)] text-[var(--primary-600)] dark:text-[var(--primary-400)] w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm border border-[var(--border-color)] shadow-sm font-black">4</span>
              Laporan Kegiatan
            </h2>
          </div>

          <div className="space-y-4">
            {activities.map((item, index) => (
              <div key={item.id} className="flex flex-col sm:flex-row gap-4 p-5 bg-[var(--surface-50)] rounded-xl border border-[var(--border-color)] relative group transition-all hover:border-[var(--primary-500)]/30">
                <div className="w-full sm:w-auto min-w-0">
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1 tracking-wider">Mulai</label>
                  <input type="time" required disabled={isReadOnly} className={inputClass} value={item.jamMulai} onChange={e => handleActivityChange(item.id, 'jamMulai', e.target.value)} />
                </div>
                <div className="w-full sm:w-auto min-w-0">
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1 tracking-wider">Selesai</label>
                  <input type="time" required disabled={isReadOnly} className={inputClass} value={item.jamSelesai} onChange={e => handleActivityChange(item.id, 'jamSelesai', e.target.value)} />
                </div>
                <div className="flex-1 w-full min-w-0">
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1 tracking-wider">Deskripsi Kegiatan</label>
                  <input type="text" required disabled={isReadOnly} placeholder="Ketik deskripsi kegiatan..." className={inputClass} value={item.deskripsi} onChange={e => handleActivityChange(item.id, 'deskripsi', e.target.value)} />
                </div>
                {activities.length > 1 && !isReadOnly && (
                  <button
                    type="button"
                    onClick={() => removeActivity(item.id)}
                    className="sm:absolute sm:-right-3 sm:-top-3 mt-2 sm:mt-0 self-end sm:self-auto bg-red-50 sm:bg-[var(--surface)] dark:bg-red-900/20 text-red-600 hover:text-white hover:bg-red-600 border border-red-200 sm:border-[var(--border-color)] dark:border-red-900/30 p-2.5 rounded-xl shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all z-10 flex items-center px-4 sm:px-2.5"
                  >
                    <Trash2 className="w-4 h-4 sm:mr-0 mr-2" />
                    <span className="sm:hidden text-xs font-bold uppercase tracking-wider">Hapus</span>
                  </button>
                )}
              </div>
            ))}

            {!isReadOnly && (
              <button
                type="button"
                onClick={addActivity}
                className="w-full flex items-center justify-center text-sm font-bold text-[var(--primary-600)] dark:text-[var(--primary-400)] hover:text-[var(--primary-700)] dark:hover:text-[var(--primary-300)] bg-[var(--primary-50)] dark:bg-[var(--primary-900)]/20 hover:bg-[var(--primary-100)] dark:hover:bg-[var(--primary-900)]/40 py-3.5 rounded-xl transition-all border border-dashed border-[var(--primary-500)]/30 mt-4"
              >
                <Plus className="w-5 h-5 mr-1" /> Tambah Baris Kegiatan
              </button>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end pt-4 gap-3">
          <button
            type="button"
            onClick={handleCancelClick}
            className="w-full sm:w-auto px-6 py-3.5 sm:px-5 sm:py-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface-50)] hover:bg-[var(--surface-hover)] border border-[var(--border-color)] rounded-xl font-bold transition-all text-base sm:text-sm flex justify-center items-center"
          >
            {isReadOnly ? 'Back' : 'Cancel'}
          </button>
          {!isReadOnly && (
            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 sm:px-6 sm:py-3 bg-[var(--primary-500)] hover:bg-[var(--primary-600)] text-white rounded-xl font-bold transition-all shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.23)] text-base sm:text-sm focus:ring-4 focus:ring-[var(--primary-500)]/30 outline-none"
            >
              <Save className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
              {initialData ? 'Update Cardlog' : 'Submit Cardlog'}
            </button>
          )}
          {isReadOnly && onEdit && isEditable && (
            <button
              type="button"
              onClick={handleEditConfirm}
              className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 sm:px-6 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] text-base sm:text-sm focus:ring-4 focus:ring-blue-500/30 outline-none"
            >
              <Edit2 className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
              Edit Cardlog
            </button>
          )}
          {isReadOnly && canExportPng && (
            <button
              type="button"
              onClick={handleExportPNGConfirm}
              className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 sm:px-6 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] text-base sm:text-sm focus:ring-4 focus:ring-indigo-500/30 outline-none"
            >
              <Download className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
              Export PNG
            </button>
          )}
        </div>

      </form>

      {/* Hidden PNG Template for Export */}
      {isReadOnly && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', pointerEvents: 'none' }}>
          <ExportPngTemplate
            ref={exportRef}
            formData={{ ...formData, submittedBy: initialData?.submitted_by_name || formData.operator }}
            checklists={checklists}
            operasional={operasional}
            activities={activities}
            odometerPhoto={odometerPhoto}
          />
        </div>
      )}

      {showPhotoModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-transparent transition-opacity" onClick={() => setShowPhotoModal(false)} />
          <div className="relative w-fit h-fit mx-auto my-auto animate-in fade-in zoom-in-95 duration-200">
            <button 
              className="absolute -top-3 -right-3 p-1.5 text-white bg-red-500 hover:bg-red-600 rounded-full shadow-md transition-all z-10"
              onClick={() => setShowPhotoModal(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={odometerPhoto} 
              alt="Odometer" 
              className="w-auto h-auto max-w-[90vw] md:max-w-3xl max-h-[85vh] rounded-lg block" 
              onClick={e => e.stopPropagation()} 
            />
          </div>
        </div>,
        document.body
      )}

      {/* Export Result Modal */}
      {exportedImage && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-transparent transition-opacity" onClick={() => { setExportedImage(null); setExportedBlob(null); URL.revokeObjectURL(exportedImage); }} />
          <div className="relative w-fit h-fit mx-auto my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center">
            <button 
              className="absolute -top-3 -right-3 p-1.5 text-white bg-red-500 hover:bg-red-600 rounded-full shadow-md transition-all z-10"
              onClick={() => { setExportedImage(null); setExportedBlob(null); URL.revokeObjectURL(exportedImage); }}
            >
              <X className="w-5 h-5" />
            </button>
            
            <img 
              src={exportedImage} 
              alt="Export Preview" 
              style={{ WebkitTouchCallout: 'default', pointerEvents: 'auto', userSelect: 'none', WebkitUserSelect: 'none' }} 
              className="w-auto h-auto max-w-[95vw] md:max-w-3xl max-h-[75vh] rounded-lg block shadow-2xl bg-white" 
              onClick={e => e.stopPropagation()} 
            />
            
            <div className="w-full max-w-[95vw] md:max-w-3xl mt-4 flex flex-col sm:flex-row sm:space-y-0 sm:space-x-3 space-y-3 shrink-0" onClick={e => e.stopPropagation()}>
              {!!navigator.share && (
                <button 
                  onClick={handleShare} 
                  onTouchStart={() => {}}
                  className="w-full flex-1 flex justify-center items-center px-4 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-all duration-150 active:scale-95 shadow-[0_4px_14px_0_rgba(22,163,74,0.39)] active:shadow-none"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Bagikan Langsung
                </button>
              )}
              <button 
                onClick={handleDownload} 
                onTouchStart={() => {}}
                className="w-full flex-1 flex justify-center items-center px-4 py-3.5 bg-[var(--primary-500)] hover:bg-[var(--primary-600)] text-white rounded-xl font-bold text-sm transition-all duration-150 active:scale-95 shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] active:shadow-none"
              >
                <Download className="w-4 h-4 mr-2" />
                Download File
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
