import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
      <div className="page-header">
        <div>
          <h1>Semua Cardlogs</h1>
          <p>Daftar seluruh history operasional unit.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
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

          {canExport && (
            <button
              onClick={handleExportToExcelConfirm}
              className="w-full sm:w-auto btn-success"
            >
              <Download className="w-5 h-5" />
              Export
            </button>
          )}
          <button
            onClick={handleCreateNew}
            className="w-full sm:w-auto btn-primary"
          >
            <Plus className="w-5 h-5" />
            New
          </button>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Shift</th>
              <th>Operator</th>
              <th>Unit</th>
              <th>Submitted By</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-skeleton">
                  <td data-label="ID"><div className="h-4 bg-[var(--border-color)] rounded w-16"></div></td>
                  <td data-label="Date"><div className="h-4 bg-[var(--border-color)] rounded w-24"></div></td>
                  <td data-label="Shift"><div className="h-4 bg-[var(--border-color)] rounded w-20"></div></td>
                  <td data-label="Operator"><div className="flex items-center"><div className="w-7 h-7 rounded-full bg-[var(--border-color)] mr-3 hidden md:block"></div><div className="h-4 bg-[var(--border-color)] rounded w-32"></div></div></td>
                  <td data-label="Unit"><div className="h-4 bg-[var(--border-color)] rounded w-16"></div></td>
                  <td data-label="Submitted By"><div className="h-4 bg-[var(--border-color)] rounded w-24"></div></td>
                  <td data-label="Actions" className="md:text-right"><div className="h-8 bg-[var(--border-color)] rounded w-24 md:ml-auto"></div></td>
                </tr>
              ))
            ) : cardlogs.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-sm font-medium text-[var(--text-secondary)]">No cardlogs found.</td>
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
                  <tr key={row.id} className="group cursor-pointer" onClick={(e) => handleView(row, e)}>
                    <td data-label="ID" className="font-extrabold text-[var(--primary-600)] dark:text-[var(--primary-400)]">#LOG-{row.id}</td>
                    <td data-label="Date" className="font-medium text-[var(--text-secondary)]">{new Date(row.date).toLocaleDateString()}</td>
                    <td data-label="Shift" className="font-bold text-[var(--text-primary)]">{row.shift_no}</td>
                    <td data-label="Operator" className="text-[var(--text-primary)]">
                      <div className="flex items-center">
                        <div className="w-7 h-7 rounded-full bg-[var(--primary-50)] dark:bg-[var(--primary-900)]/30 text-[var(--primary-600)] dark:text-[var(--primary-400)] border border-[var(--primary-500)]/20 items-center justify-center text-xs font-bold mr-3 hidden md:flex">
                          {row.operator.charAt(0)}
                        </div>
                        <span className="font-semibold">{row.operator}</span>
                      </div>
                    </td>
                    <td data-label="Unit" className="font-black text-[var(--text-primary)]">{row.unit_no}</td>
                    <td data-label="Submitted By" className="font-medium text-[var(--text-secondary)]">{row.submitted_by_name || '-'}</td>
                    <td data-label="Actions" className="md:text-right">
                      <div className="flex md:justify-end space-x-1.5 transition-opacity mt-2 md:mt-0" onClick={(e) => e.stopPropagation()}>
                        {!isEditable && (
                          <button onClick={(e) => handleView(row, e)} className="p-2 text-green-600 hover:text-white bg-green-50 md:bg-transparent rounded-lg hover:bg-green-600 transition-colors" title="View Cardlog">
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                        {isEditable && (
                          <button onClick={(e) => handleEditConfirm(row, e)} className="p-2 text-blue-600 hover:text-white bg-blue-50 md:bg-transparent rounded-lg hover:bg-blue-600 transition-colors" title="Edit Cardlog">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canExportPng && (
                          <button onClick={(e) => handleExportPngConfirm(row, e)} className="p-2 text-indigo-600 hover:text-white bg-indigo-50 md:bg-transparent rounded-lg hover:bg-indigo-600 transition-colors" title="Export PNG">
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        )}
                        {canResendEmail && (
                          <button onClick={(e) => handleResendEmail(row.id, e)} className="p-2 text-yellow-600 hover:text-white bg-yellow-50 md:bg-transparent rounded-lg hover:bg-yellow-500 transition-colors" title="Resend Email">
                            <Mail className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(row.id)} className="p-2 text-red-600 hover:text-white bg-red-50 md:bg-transparent rounded-lg hover:bg-red-600 transition-colors" title="Hapus Cardlog">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
