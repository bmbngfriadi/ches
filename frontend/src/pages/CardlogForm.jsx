import React, { useState, useEffect, useRef } from 'react';
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
        const compressedBase64 = await compressImage(file, 2);
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
            const dataUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
            // Update React state directly so the DOM re-renders with the Base64 image
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
          // FIX: Call toPng twice for iOS Safari. The first call forces Safari to load the image into canvas cache
          await toPng(exportRef.current, { skipFonts: true, pixelRatio: 1, backgroundColor: '#ffffff' });
          
          const dataUrl = await toPng(exportRef.current, {
            backgroundColor: '#ffffff',
            pixelRatio: 2, // High resolution
            skipFonts: true // Fix for iOS Safari WebGL bug
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
      
      // Trigger click slightly after to avoid interrupting React render cycle on mobile
      setTimeout(() => {
        link.click();
      }, 500);
      
    } catch (err) {
      showAlert('Gagal!', 'Terjadi kesalahan saat mendownload file.', 'error');
    }
  };

  const inputClass = "mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-[#b52025] focus:ring-1 focus:ring-[#b52025] focus:outline-none transition-colors sm:text-sm";
  const selectClass = "mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-[#b52025] focus:ring-1 focus:ring-[#b52025] focus:outline-none transition-colors sm:text-sm appearance-none";

  return (
    <div className="max-w-4xl mx-auto py-2 px-2 sm:px-0">
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white dark:bg-gray-950 rounded-md border border-gray-200 dark:border-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isReadOnly ? 'View Cardlog' : (initialData ? 'Edit Cardlog' : 'New Cardlog')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Isi laporan operasional unit heavy equipment.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-950 rounded-md p-6 sm:p-8 border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase flex items-center">
              <span className="bg-[#b52025] text-white p-1.5 rounded-md mr-3">
                <FileText className="w-5 h-5" />
              </span>
              {initialData ? (isReadOnly ? 'View Cardlog' : 'Edit Cardlog') : 'Formulir Cardlog Baru'}
            </h2>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">
              Lengkapi data pemeriksaan awal, akhir, dan operasional unit
            </p>
            {initialData && initialData.created_at && (
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-2">
                Disubmit pada: {new Date(initialData.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-950 rounded-md p-4 sm:p-8 border border-gray-200 dark:border-gray-800 overflow-hidden w-full">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <span className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 w-8 h-8 rounded flex items-center justify-center mr-3 text-sm">1</span>
            Data Header
          </h2>
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-6 w-full">
            <div className="w-full min-w-0">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Hari, Tanggal</label>
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
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Shift No</label>
              <select className={selectClass} disabled={isReadOnly} value={formData.shift} onChange={e => setFormData({ ...formData, shift: e.target.value })}>
                <option value="Shift 1">Shift 01 (00:00 - 08:00)</option>
                <option value="Shift 2">Shift 02 (08:00 - 16:00)</option>
                <option value="Shift 3">Shift 03 (16:00 - 00:00)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Operator</label>
              <input type="text" required placeholder="Nama Operator" disabled={isReadOnly} className={inputClass} value={formData.operator} onChange={e => setFormData({ ...formData, operator: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Nomor Unit</label>
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
        <div className="bg-white dark:bg-gray-950 rounded-md p-4 sm:p-8 border border-gray-200 dark:border-gray-800 overflow-hidden w-full">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <span className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 w-8 h-8 rounded flex items-center justify-center mr-3 text-sm">2</span>
            Item Checklist
          </h2>
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-y-6 gap-x-8 w-full">
            {CHECKLIST_ITEMS.map((item) => (
              <div key={item} className="flex flex-col border-b border-gray-100 dark:border-gray-800/50 pb-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{item}</label>
                  <select
                    disabled={isReadOnly}
                    className="ml-4 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-semibold py-1.5 px-3 focus:ring-[#b52025] focus:border-[#b52025] dark:text-white outline-none w-32 appearance-none"
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
                      className="w-full text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 px-3 py-2 text-gray-900 dark:text-white focus:border-[#b52025] focus:ring-1 focus:ring-[#b52025] focus:outline-none transition-colors"
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
        <div className="bg-white dark:bg-gray-950 rounded-md p-4 sm:p-8 border border-gray-200 dark:border-gray-800 overflow-hidden w-full">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <span className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 w-8 h-8 rounded flex items-center justify-center mr-3 text-sm">3</span>
            Operasional Unit
          </h2>
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-6 w-full">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">HM Awal</label>
              <input type="number" required disabled={isReadOnly} placeholder="0.00" step="0.01" className={inputClass} value={operasional.hmAwal} onChange={e => handleOperasionalChange('hmAwal', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">HM Akhir</label>
              <input type="number" required disabled={isReadOnly} placeholder="0.00" step="0.01" className={inputClass} value={operasional.hmAkhir} onChange={e => handleOperasionalChange('hmAkhir', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Odometer Awal</label>
              <input type="number" required disabled={isReadOnly} placeholder="0.00" step="0.01" className={inputClass} value={operasional.odoAwal} onChange={e => handleOperasionalChange('odoAwal', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Odometer Akhir</label>
              <input type="number" required disabled={isReadOnly} placeholder="0.00" step="0.01" className={inputClass} value={operasional.odoAkhir} onChange={e => handleOperasionalChange('odoAkhir', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Durasi Charging</label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Mulai</label>
                  <input type="time" disabled={isReadOnly} className={inputClass} value={operasional.chargingMulai} onChange={e => handleOperasionalChange('chargingMulai', e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Selesai</label>
                  <input type="time" disabled={isReadOnly} className={inputClass} value={operasional.chargingSelesai} onChange={e => handleOperasionalChange('chargingSelesai', e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Total (Jam)</label>
                  <input type="text" readOnly className={`${inputClass} bg-gray-50 dark:bg-gray-800 font-bold text-[#b52025] border-transparent cursor-not-allowed`} value={operasional.chargingTotal} />
                </div>
              </div>
            </div>

            <div className="sm:col-span-2 pt-4 border-t border-gray-100 dark:border-gray-800">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Foto Odometer <span className="text-red-500">*</span></label>
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="w-full sm:w-1/3 flex flex-col gap-3">
                  <div className="aspect-video bg-gray-100 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md flex items-center justify-center overflow-hidden relative">
                    {odometerPhoto ? (
                      <img src={odometerPhoto} alt="Odometer" className="w-full h-full object-cover cursor-pointer" onClick={() => setShowPhotoModal(true)} />
                    ) : (
                      <div className="text-center p-4">
                        <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <span className="text-xs text-gray-500 font-semibold">Foto (Auto-Compress)</span>
                      </div>
                    )}
                  </div>

                  {!isReadOnly && (
                    <div className="flex gap-2">
                      <label className="flex-1 cursor-pointer flex items-center justify-center text-xs font-bold text-white bg-[#b52025] hover:bg-[#8c191c] py-2 px-2 rounded-md shadow-sm transition-colors text-center">
                        Buka Kamera
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
                      </label>
                      <label className="flex-1 cursor-pointer flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 py-2 px-2 rounded-md shadow-sm transition-colors text-center">
                        Pilih Galeri
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                      </label>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-2">
                    Unggah foto yang jelas menunjukkan angka Hour Meter (HM) atau Odometer terakhir pada unit. Pastikan angka dapat terbaca dengan baik.
                  </p>
                  <p className="text-xs font-semibold text-[#b52025]">Wajib diisi untuk memvalidasi angka HM/Odometer.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Laporan Kegiatan */}
        <div className="bg-white dark:bg-gray-950 rounded-md p-6 sm:p-8 border border-gray-200 dark:border-gray-800">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <span className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 w-8 h-8 rounded flex items-center justify-center mr-3 text-sm">4</span>
              Laporan Kegiatan
            </h2>
          </div>

          <div className="space-y-4">
            {activities.map((item, index) => (
              <div key={item.id} className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-md border border-gray-200 dark:border-gray-800 relative group">
                <div className="w-full sm:w-auto min-w-0">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Mulai</label>
                  <input type="time" required disabled={isReadOnly} className={inputClass} value={item.jamMulai} onChange={e => handleActivityChange(item.id, 'jamMulai', e.target.value)} />
                </div>
                <div className="w-full sm:w-auto min-w-0">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Selesai</label>
                  <input type="time" required disabled={isReadOnly} className={inputClass} value={item.jamSelesai} onChange={e => handleActivityChange(item.id, 'jamSelesai', e.target.value)} />
                </div>
                <div className="flex-1 w-full min-w-0">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Deskripsi Kegiatan</label>
                  <input type="text" required disabled={isReadOnly} placeholder="Ketik deskripsi kegiatan..." className={inputClass} value={item.deskripsi} onChange={e => handleActivityChange(item.id, 'deskripsi', e.target.value)} />
                </div>
                {activities.length > 1 && !isReadOnly && (
                  <button
                    type="button"
                    onClick={() => removeActivity(item.id)}
                    className="sm:absolute sm:-right-3 sm:-top-3 mt-2 sm:mt-0 self-end sm:self-auto bg-red-50 sm:bg-white dark:bg-red-900/20 sm:dark:bg-gray-800 text-red-500 sm:text-red-500 hover:text-white hover:bg-red-500 border border-red-100 sm:border-gray-200 dark:border-red-900/30 sm:dark:border-gray-700 p-2.5 sm:p-2 rounded-md shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all z-10 flex items-center px-4 sm:px-2"
                  >
                    <Trash2 className="w-4 h-4 sm:mr-0 mr-1.5" />
                    <span className="sm:hidden text-xs font-bold uppercase">Hapus</span>
                  </button>
                )}
              </div>
            ))}

            {!isReadOnly && (
              <button
                type="button"
                onClick={addActivity}
                className="w-full flex items-center justify-center text-sm font-bold text-[#b52025] hover:text-[#8c191c] bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 py-3 rounded-md transition-colors border border-dashed border-[#b52025]/30 mt-4"
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
            className="w-full sm:w-auto px-6 py-3.5 sm:px-5 sm:py-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 rounded-md font-bold transition-all text-base sm:text-sm flex justify-center items-center"
          >
            {isReadOnly ? 'Back' : 'Cancel'}
          </button>
          {!isReadOnly && (
            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 sm:px-6 sm:py-2.5 bg-[#b52025] hover:bg-[#8c191c] text-white rounded-md font-bold transition-all text-base sm:text-sm focus:ring-4 focus:ring-[#b52025]/50 outline-none"
            >
              <Save className="w-5 h-5 sm:w-4 sm:h-4 mr-1.5" />
              {initialData ? 'Update Cardlog' : 'Submit Cardlog'}
            </button>
          )}
          {isReadOnly && onEdit && isEditable && (
            <button
              type="button"
              onClick={handleEditConfirm}
              className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 sm:px-6 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold transition-all text-base sm:text-sm focus:ring-4 focus:ring-blue-500/50 outline-none"
            >
              <Edit2 className="w-5 h-5 sm:w-4 sm:h-4 mr-1.5" />
              Edit Cardlog
            </button>
          )}
          {isReadOnly && canExportPng && (
            <button
              type="button"
              onClick={handleExportPNGConfirm}
              className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 sm:px-6 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-bold transition-all text-base sm:text-sm focus:ring-4 focus:ring-indigo-500/50 outline-none"
            >
              <Download className="w-5 h-5 sm:w-4 sm:h-4 mr-1.5" />
              Export PNG
            </button>
          )}
        </div>

      </form>

      {/* Hidden PNG Template for Export */}
      {isReadOnly && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', pointerEvents: 'none', zIndex: -100 }}>
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

      {showPhotoModal && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4" onClick={() => setShowPhotoModal(false)}>
          <img src={odometerPhoto} alt="Odometer Full" className="max-w-full max-h-[90vh] rounded-md object-contain shadow-lg" onClick={e => e.stopPropagation()} />
          <button className="absolute top-4 right-4 text-white hover:text-red-500 bg-black/50 hover:bg-white rounded-full p-2 transition-colors" onClick={() => setShowPhotoModal(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Export Result Modal */}
      {exportedImage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => { setExportedImage(null); setExportedBlob(null); URL.revokeObjectURL(exportedImage); }} />
          <div className="relative bg-white dark:bg-gray-900 rounded-md shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-white">PNG Siap!</h3>
              <button onClick={() => { setExportedImage(null); setExportedBlob(null); URL.revokeObjectURL(exportedImage); }} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col items-center bg-gray-50 dark:bg-gray-950 pointer-events-auto">
              <img src={exportedImage} alt="Export Preview" style={{ WebkitTouchCallout: 'default', pointerEvents: 'auto', userSelect: 'none', WebkitUserSelect: 'none' }} className="w-full h-auto max-h-64 object-contain shadow-lg border border-gray-200 dark:border-gray-800 mb-6 rounded cursor-pointer" />
              
              <div className="w-full flex flex-col space-y-3">
                {!!navigator.share && (
                  <button 
                    onClick={handleShare} 
                    onTouchStart={() => {}}
                    className="w-full flex justify-center items-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-bold text-sm transition-all duration-150 active:scale-95 shadow-md active:shadow-none"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Bagikan Langsung
                  </button>
                )}
                <button 
                  onClick={handleDownload} 
                  onTouchStart={() => {}}
                  className="w-full flex justify-center items-center px-4 py-3 bg-[#b52025] hover:bg-[#8c191c] text-white rounded-md font-bold text-sm transition-all duration-150 active:scale-95 shadow-md active:shadow-none"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
