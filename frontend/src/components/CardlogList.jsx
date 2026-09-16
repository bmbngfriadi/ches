import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Download, FileText, Search, Image as ImageIcon, Mail, Share2, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import ExportPngTemplate from './ExportPngTemplate';
import api from '../api';
import { useAlert } from '../context/AlertContext';

export default function CardlogList({ cardlogs, loading, onNavigate, refreshLogs }) {
  const [searchTerm, setSearchTerm] = useState('');
  const { showAlert, closeAlert } = useAlert();
  const currentUser = JSON.parse(localStorage.getItem('ches_user') || '{}');
  const isAdmin = currentUser.role === 'administrator/dev';
  const permissions = currentUser.permissions || [];
  
  // If user has 1h restriction, we use that. If they only have unlimited edit, we use that.
  // If admin accidentally checked both, treat it as restricted to 1h to be safe.
  const has1hEdit = permissions.includes('cardlog_edit_1h');
  const hasUnlimitedEdit = permissions.includes('cardlog_edit');
  const canEditAny = isAdmin || (hasUnlimitedEdit && !has1hEdit);
  const canEdit1h = !isAdmin && has1hEdit;
  
  const canDelete = isAdmin || permissions.includes('cardlog_delete');
  const canExport = isAdmin || permissions.includes('cardlog_export');
  const canExportPng = isAdmin || permissions.includes('cardlog_export_png');
  const canResendEmail = isAdmin || permissions.includes('resend_email_notification');

  const [activeExportRow, setActiveExportRow] = useState(null);
  const [exportedImage, setExportedImage] = useState(null);
  const [exportedBlob, setExportedBlob] = useState(null);
  const [exportFilename, setExportFilename] = useState('');
  const exportRef = useRef(null);

  const CHECKLIST_ITEMS = [
    'Lampu Depan', 'Lampu Belakang', 'Ban Depan', 'Ban Belakang', 
    'Klakson', 'Alarm Mundur', 'Rem Jalan', 'Rem Parkir', 
    'Sabuk Pengaman', 'Kebersihan'
  ];

  useEffect(() => {
    if (activeExportRow && exportRef.current) {
      const exportImage = async () => {
        try {
          const { toPng } = await import('html-to-image');
          const dataUrl = await toPng(exportRef.current, {
            backgroundColor: '#ffffff',
            pixelRatio: 2,
            skipFonts: true,
            style: { margin: '0' }
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
          setExportFilename(`Cardlog_${activeExportRow.id}_${activeExportRow.unit_no}.png`);
          
          if (closeAlert) closeAlert(); // Close the loading alert
        } catch (err) {
          console.error(err);
          showAlert('Gagal', 'Terjadi kesalahan saat mengekspor: ' + (err.message || err.toString()), 'error');
        } finally {
          setActiveExportRow(null);
        }
      };
      setTimeout(exportImage, 300); // Give enough time for DOM to render for iOS
    }
  }, [activeExportRow]);

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

  const handleCreateNew = () => {
    onNavigate('new-cardlog');
  };

  const handleExportToExcelConfirm = () => {
    showAlert(
      'Download Excel',
      'Mulai proses pengunduhan laporan ke format Excel?',
      'confirm',
      () => handleExportToExcel()
    );
  };

  const handleExportToExcel = () => {
    if (!cardlogs || cardlogs.length === 0) {
      return showAlert('Peringatan', 'Tidak ada data untuk diexport', 'warning');
    }
    
    const excelData = [];
    
    // Metadata Header
    excelData.push(['Audit Report: Cardlog Operations']);
    excelData.push(['Generated By:', currentUser.full_name || currentUser.username]);
    excelData.push(['Date:', new Date().toLocaleDateString()]);
    excelData.push(['Time:', new Date().toLocaleTimeString()]);
    excelData.push([]);
    
    // Table Headers
    excelData.push([
      'ID', 'Date', 'Shift', 'Operator', 'Unit No', 
      'HM Awal', 'HM Akhir', 'Odometer Awal', 'Odometer Akhir', 'Charging Durasi (Jam)',
      'Lampu Depan', 'Lampu Belakang', 'Ban Depan', 'Ban Belakang', 'Klakson', 
      'Alarm Mundur', 'Rem Jalan', 'Rem Parkir', 'Sabuk Pengaman', 'Kebersihan',
      'Status', 'Jam Mulai Kegiatan', 'Jam Selesai Kegiatan', 'Deskripsi Kegiatan'
    ]);
    
    // Table Rows
    const logsToExport = searchTerm ? cardlogs.filter(log => {
      const term = searchTerm.toLowerCase();
      return log.operator?.toLowerCase().includes(term) || log.unit_no?.toLowerCase().includes(term) || String(log.id).includes(term);
    }) : cardlogs;

    logsToExport.forEach(log => {
      const baseRowData = [
        `LOG-${log.id}`,
        new Date(log.date).toLocaleDateString(),
        log.shift_no,
        log.operator,
        log.unit_no,
        log.hm_awal || '',
        log.hm_akhir || '',
        log.odometer_awal || '',
        log.odometer_akhir || '',
        log.charging_durasi || '',
        log.lampu_depan || '',
        log.lampu_belakang || '',
        log.ban_depan || '',
        log.ban_belakang || '',
        log.klakson || '',
        log.alarm_mundur || '',
        log.rem_jalan || '',
        log.rem_parkir || '',
        log.sabuk_pengaman || '',
        log.kebersihan || '',
        'Completed'
      ];

      if (log.activities && log.activities.length > 0) {
        // Create 1 row per activity
        log.activities.forEach(act => {
          excelData.push([
            ...baseRowData,
            act.jam_mulai || '',
            act.jam_selesai || '',
            act.deskripsi || ''
          ]);
        });
      } else {
        // No activities, just output the base row with empty activity columns
        excelData.push([...baseRowData, '', '', '']);
      }
    });
    
    // Create Workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    // Style column widths
    const wscols = [
      {wch: 10}, {wch: 15}, {wch: 10}, {wch: 20}, {wch: 10}, 
      {wch: 10}, {wch: 10}, {wch: 15}, {wch: 15}, {wch: 22},
      {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, 
      {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15},
      {wch: 15}, {wch: 15}, {wch: 15}, {wch: 40}
    ];
    ws['!cols'] = wscols;
    
    XLSX.utils.book_append_sheet(wb, ws, "Cardlogs");
    
    XLSX.writeFile(wb, `Cardlog_Audit_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getTemplateProps = (row) => {
    if (!row) return null;
    const formData = {
      date: new Date(row.date).toISOString().split('T')[0],
      shift: row.shift_no,
      operator: row.operator,
      unitNo: row.unit_no,
      submittedBy: row.submitted_by_name || row.operator
    };
    const checklists = CHECKLIST_ITEMS.reduce((acc, item) => {
      const dbKey = item.toLowerCase().replace(' ', '_');
      const val = row[dbKey];
      let status = 'Baik';
      let notes = '';
      if (val && !['Baik', 'Rusak', 'Error'].includes(val)) {
        status = 'Others';
        notes = val;
      } else if (val) {
        status = val;
      }
      acc[item] = { status, notes };
      return acc;
    }, {});
    const operasional = {
      hmAwal: row.hm_awal, hmAkhir: row.hm_akhir,
      odoAwal: row.odometer_awal, odoAkhir: row.odometer_akhir,
      chargingMulai: row.charging_mulai || '', chargingSelesai: row.charging_selesai || '',
      chargingTotal: row.charging_durasi || 0
    };
    const activities = (row.activities || []).map(act => ({
      jamMulai: act.jam_mulai ? act.jam_mulai.substring(0, 5) : '',
      jamSelesai: act.jam_selesai ? act.jam_selesai.substring(0, 5) : '',
      deskripsi: act.deskripsi
    }));
    return { formData, checklists, operasional, activities, odometerPhoto: row.odometer_photo_base64 || row.odometer_photo };
  };

  const templateProps = getTemplateProps(activeExportRow);

  const handleDelete = (id) => {
    showAlert(
      'Konfirmasi Hapus',
      'Yakin ingin menghapus cardlog ini?',
      'confirm',
      async () => {
        try {
          await api.delete(`/cardlogs/${id}`);
          if (refreshLogs) refreshLogs();
          showAlert('Sukses!', 'Cardlog berhasil dihapus', 'success');
        } catch (err) {
          showAlert('Gagal!', 'Gagal menghapus cardlog: ' + (err.response?.data?.message || err.message), 'error');
        }
      }
    );
  };

  const handleResendEmail = async (id, e) => {
    e.stopPropagation();
    showAlert(
      'Konfirmasi Resend',
      'Kirim ulang notifikasi email untuk laporan cardlog ini?',
      'confirm',
      async () => {
        showAlert('Memproses...', 'Sedang mengirim ulang email, mohon tunggu sebentar...', 'loading');
        try {
          const res = await api.post(`/cardlogs/${id}/resend-email`);
          showAlert('Sukses!', res.data.message || 'Email berhasil dikirim ulang.', 'success');
        } catch (err) {
          showAlert('Gagal!', err.response?.data?.message || 'Gagal mengirim ulang email.', 'error');
        }
      }
    );
  };

  const fetchPhotoForCardlog = async (id) => {
    try {
      const res = await api.get(`/cardlogs/${id}/photo`);
      return res.data.photo;
    } catch (err) {
      console.warn('Gagal memuat foto dari API', err);
      return null;
    }
  };

  const handleView = async (row, e) => {
    if (e) e.stopPropagation();
    showAlert('Memuat...', 'Sedang mengambil detail data...', 'loading');
    const photo = await fetchPhotoForCardlog(row.id);
    const rowWithPhoto = { ...row, odometer_photo: photo };
    if (closeAlert) closeAlert(); // clear alert
    onNavigate('view-cardlog', rowWithPhoto);
  };

  const handleEditConfirm = (row, e) => {
    if (e) e.stopPropagation();
    showAlert(
      'Konfirmasi Edit',
      'Apakah Anda yakin ingin mengedit data cardlog ini?',
      'confirm',
      async () => {
        showAlert('Memuat...', 'Sedang mengambil detail data...', 'loading');
        const photo = await fetchPhotoForCardlog(row.id);
        const rowWithPhoto = { ...row, odometer_photo: photo };
        if (closeAlert) closeAlert(); // clear alert
        onNavigate('edit-cardlog', rowWithPhoto);
      }
    );
  };

  const handleExportPngConfirm = (row, e) => {
    if (e) e.stopPropagation();
    showAlert(
      'Konfirmasi Export PNG',
      'Apakah Anda yakin ingin mengekspor data cardlog ini sebagai gambar PNG?',
      'confirm',
      async () => {
        showAlert('Memproses...', 'Sedang memuat data gambar PNG, mohon tunggu...', 'loading');
        
        try {
          let photoDataUrl = await fetchPhotoForCardlog(row.id);
          
          if (photoDataUrl && !photoDataUrl.startsWith('data:')) {
            const res = await fetch(photoDataUrl, { cache: 'no-cache' });
            const blob = await res.blob();
            // Load image and compress it to bypass iOS Safari SVG size limits
            photoDataUrl = await new Promise((resolve, reject) => {
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
                resolve(canvas.toDataURL('image/jpeg', 0.7));
              };
              img.onerror = () => reject(new Error('Image load failed'));
              img.src = URL.createObjectURL(blob);
            });
          }
          const rowWithBase64 = { ...row, odometer_photo_base64: photoDataUrl };
          setActiveExportRow(rowWithBase64);
        } catch (err) {
          console.warn('Gagal memuat foto untuk Export', err);
          setActiveExportRow(row); // fallback without photo
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">Semua Cardlogs</h1>
          <p className="text-sm text-[var(--text-secondary)] font-medium mt-1">Daftar seluruh history operasional unit.</p>
        </div>
        
        <div className="flex items-center bg-[var(--surface)] rounded-xl px-4 py-3 border border-[var(--border-color)] focus-within:ring-2 focus-within:ring-[var(--primary-500)]/30 focus-within:border-transparent transition-all w-full sm:w-80 shadow-sm">
          <Search className="w-5 h-5 text-[var(--text-secondary)] mr-3" />
          <input 
            type="text" 
            placeholder="Search operator, unit, or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full text-[var(--text-primary)]"
          />
        </div>

        <div className="flex space-x-3 w-full sm:w-auto">
          {canExport && (
            <button
              onClick={handleExportToExcelConfirm}
              className="flex items-center justify-center px-5 py-3 sm:py-2.5 text-base sm:text-sm bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-sm hover:shadow-md"
            >
              <Download className="w-5 h-5 mr-2" />
              Export Excel
            </button>
          )}
          <button
            onClick={handleCreateNew}
            className="flex items-center justify-center px-5 py-3 sm:py-2.5 text-base sm:text-sm bg-[var(--primary-500)] text-white rounded-xl font-bold hover:bg-[var(--primary-600)] transition-all shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.23)] hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Cardlog
          </button>
        </div>
      </div>

      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm">
        {/* Desktop Table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full divide-y divide-[var(--border-color)]">
            <thead className="bg-[var(--surface-50)] border-b border-[var(--border-color)]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Shift</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Operator</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Unit</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Submitted By</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-skeleton">
                    <td className="px-6 py-4"><div className="h-4 bg-[var(--border-color)] rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-[var(--border-color)] rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-[var(--border-color)] rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="flex items-center"><div className="w-7 h-7 rounded-full bg-[var(--border-color)] mr-3"></div><div className="h-4 bg-[var(--border-color)] rounded w-32"></div></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-[var(--border-color)] rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-[var(--border-color)] rounded w-24"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-8 bg-[var(--border-color)] rounded w-24 ml-auto"></div></td>
                  </tr>
                ))
              ) : cardlogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-sm font-medium text-[var(--text-secondary)]">No cardlogs found.</td>
                </tr>
              ) : (
                cardlogs.filter(log => {
                  if (!searchTerm) return true;
                  const term = searchTerm.toLowerCase();
                  return log.operator?.toLowerCase().includes(term) || log.unit_no?.toLowerCase().includes(term) || String(log.id).includes(term);
                }).map((row, index) => {
                  let isEditable = canEditAny;
                  if (!isEditable && canEdit1h && row.age_minutes !== undefined) {
                    if (parseFloat(row.age_minutes) <= 60 && parseFloat(row.age_minutes) >= 0) {
                      isEditable = true;
                    }
                  }

                  return (
                    <tr 
                      key={row.id} 
                      className={`hover:bg-[var(--surface-hover)] transition-colors cursor-pointer group animate-page-enter`}
                      onClick={(e) => handleView(row, e)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-[var(--primary-600)] dark:text-[var(--primary-400)]">#LOG-{row.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--text-secondary)]">{new Date(row.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[var(--text-primary)]">{row.shift_no}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                        <div className="flex items-center">
                          <div className="w-7 h-7 rounded-full bg-[var(--primary-50)] dark:bg-[var(--primary-900)]/30 text-[var(--primary-600)] dark:text-[var(--primary-400)] border border-[var(--primary-500)]/20 flex items-center justify-center text-xs font-bold mr-3">
                            {row.operator.charAt(0)}
                          </div>
                          <span className="font-semibold">{row.operator}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-[var(--text-primary)]">{row.unit_no}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--text-secondary)]">{row.submitted_by_name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right flex justify-end space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        {!isEditable && (
                          <button onClick={(e) => handleView(row, e)} className="p-2 text-green-600 hover:text-white rounded-lg hover:bg-green-600 transition-colors" title="View Cardlog">
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                        {isEditable && (
                          <button onClick={(e) => handleEditConfirm(row, e)} className="p-2 text-blue-600 hover:text-white rounded-lg hover:bg-blue-600 transition-colors" title="Edit Cardlog">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canExportPng && (
                          <button onClick={(e) => handleExportPngConfirm(row, e)} className="p-2 text-indigo-600 hover:text-white rounded-lg hover:bg-indigo-600 transition-colors" title="Export PNG">
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        )}
                        {canResendEmail && (
                          <button onClick={(e) => handleResendEmail(row.id, e)} className="p-2 text-yellow-600 hover:text-white rounded-lg hover:bg-yellow-500 transition-colors" title="Resend Email">
                            <Mail className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(row.id)} className="p-2 text-red-600 hover:text-white rounded-lg hover:bg-red-600 transition-colors" title="Hapus Cardlog">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="grid grid-cols-1 gap-4 p-4 md:hidden bg-[var(--bg-default)]">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border-color)] flex flex-col space-y-4 shadow-sm animate-skeleton">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="h-3 bg-[var(--border-color)] rounded w-16 mb-2"></div>
                    <div className="h-5 bg-[var(--border-color)] rounded w-24 mb-1"></div>
                    <div className="h-4 bg-[var(--border-color)] rounded w-20"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-3 bg-[var(--border-color)] rounded w-16 mb-2 ml-auto"></div>
                    <div className="h-5 bg-[var(--border-color)] rounded w-12 mb-1 ml-auto"></div>
                    <div className="h-4 bg-[var(--border-color)] rounded w-16 ml-auto"></div>
                  </div>
                </div>
                <div className="pt-3 border-t border-[var(--border-color)]">
                  <div className="h-3 bg-[var(--border-color)] rounded w-16 mb-2"></div>
                  <div className="flex items-center"><div className="w-6 h-6 rounded-full bg-[var(--border-color)] mr-2"></div><div className="h-4 bg-[var(--border-color)] rounded w-32"></div></div>
                </div>
              </div>
            ))
          ) : cardlogs.length === 0 ? (
            <div className="text-center p-4 text-[var(--text-secondary)] font-medium">No cardlogs found.</div>
          ) : (
            cardlogs.filter(log => {
              if (!searchTerm) return true;
              const term = searchTerm.toLowerCase();
              return log.operator?.toLowerCase().includes(term) || log.unit_no?.toLowerCase().includes(term) || String(log.id).includes(term);
            }).map((row, index) => {
              let isEditable = canEditAny;
              if (!isEditable && canEdit1h && row.age_minutes !== undefined) {
                if (parseFloat(row.age_minutes) <= 60 && parseFloat(row.age_minutes) >= 0) {
                  isEditable = true;
                }
              }

              return (
                <div 
                  key={row.id}
                  className={`bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border-color)] flex flex-col space-y-4 cursor-pointer shadow-sm active:scale-[0.98] transition-transform animate-page-enter`}
                  onClick={(e) => handleView(row, e)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase block mb-1 tracking-wider">ID & Date</span>
                      <div className="text-sm font-extrabold text-[var(--primary-600)] dark:text-[var(--primary-400)]">#LOG-{row.id}</div>
                      <div className="text-xs font-medium text-[var(--text-secondary)]">{new Date(row.date).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase block mb-1 tracking-wider">Unit & Shift</span>
                      <div className="text-sm font-black text-[var(--primary-500)] bg-[var(--primary-500)]/10 px-2 py-0.5 rounded inline-block">{row.unit_no}</div>
                      <div className="text-xs font-bold text-[var(--text-primary)] mt-1">{row.shift_no}</div>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-[var(--border-color)]">
                    <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase block mb-2 tracking-wider">Operator</span>
                    <div className="flex items-center text-sm font-bold text-[var(--text-primary)]">
                      <div className="w-6 h-6 rounded-full bg-[var(--primary-50)] dark:bg-[var(--primary-900)]/30 text-[var(--primary-600)] dark:text-[var(--primary-400)] border border-[var(--primary-500)]/20 flex items-center justify-center text-[10px] font-bold mr-2">
                        {row.operator.charAt(0)}
                      </div>
                      {row.operator}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--border-color)]">
                    <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase block mb-1 tracking-wider">Submitted By</span>
                    <div className="text-xs font-medium text-[var(--text-secondary)]">
                      {row.submitted_by_name || '-'}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-3 border-t border-[var(--border-color)] mt-2" onClick={(e) => e.stopPropagation()}>
                    {!isEditable && (
                      <button onClick={(e) => handleView(row, e)} className="p-2.5 text-green-600 bg-green-50 dark:bg-green-900/20 rounded-xl" title="View">
                        <FileText className="w-4 h-4" />
                      </button>
                    )}
                    {isEditable && (
                      <button onClick={(e) => handleEditConfirm(row, e)} className="p-2.5 text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-xl" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {canExportPng && (
                      <button onClick={(e) => handleExportPngConfirm(row, e)} className="p-2.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl" title="Export PNG">
                        <ImageIcon className="w-4 h-4" />
                      </button>
                    )}
                    {canResendEmail && (
                      <button onClick={(e) => handleResendEmail(row.id, e)} className="p-2.5 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl" title="Resend Email">
                        <Mail className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => handleDelete(row.id)} className="p-2.5 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      {/* Hidden PNG Template for Export */}
      {activeExportRow && templateProps && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', pointerEvents: 'none' }}>
          <ExportPngTemplate 
            ref={exportRef}
            formData={templateProps.formData}
            checklists={templateProps.checklists}
            operasional={templateProps.operasional}
            activities={templateProps.activities}
            odometerPhoto={templateProps.odometerPhoto}
          />
        </div>
      )}

      {/* Export Result Modal */}
      {exportedImage && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md" onClick={() => { setExportedImage(null); setExportedBlob(null); URL.revokeObjectURL(exportedImage); }} />
          <div className="relative bg-[var(--surface)] rounded-t-[32px] sm:rounded-2xl shadow-2xl border border-[var(--border-color)] w-full max-w-sm overflow-hidden animate-slide-up-sheet sm:animate-in sm:fade-in sm:zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-[var(--border-color)]">
              <h3 className="font-extrabold text-[var(--text-primary)]">PNG Siap!</h3>
              <button onClick={() => { setExportedImage(null); setExportedBlob(null); URL.revokeObjectURL(exportedImage); }} className="p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col items-center bg-[var(--surface-50)] pointer-events-auto">
              <img src={exportedImage} alt="Export Preview" style={{ WebkitTouchCallout: 'default', pointerEvents: 'auto', userSelect: 'none', WebkitUserSelect: 'none' }} className="w-full h-auto max-h-64 object-contain shadow-md border border-[var(--border-color)] mb-6 rounded-xl cursor-pointer hover:scale-[1.02] transition-transform" />
              
              <div className="w-full flex flex-col space-y-3">
                {!!navigator.share && (
                  <button 
                    onClick={handleShare} 
                    onTouchStart={() => {}}
                    className="w-full flex justify-center items-center px-4 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-all duration-150 active:scale-95 shadow-[0_4px_14px_0_rgba(22,163,74,0.39)] active:shadow-none"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Bagikan Langsung
                  </button>
                )}
                <button 
                  onClick={handleDownload} 
                  onTouchStart={() => {}}
                  className="w-full flex justify-center items-center px-4 py-3.5 bg-[var(--primary-500)] hover:bg-[var(--primary-600)] text-white rounded-xl font-bold text-sm transition-all duration-150 active:scale-95 shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] active:shadow-none"
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
