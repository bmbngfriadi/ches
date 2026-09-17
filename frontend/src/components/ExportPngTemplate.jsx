import React from 'react';

const CHECKLIST_ITEMS = [
  'Lampu Depan', 'Lampu Belakang', 'Ban Depan', 'Ban Belakang', 
  'Klakson', 'Alarm Mundur', 'Rem Jalan', 'Rem Parkir', 
  'Sabuk Pengaman', 'Kebersihan'
];

const ExportPngTemplate = React.forwardRef(({ 
  formData, 
  checklists, 
  operasional, 
  activities,
  odometerPhoto
}, ref) => {
  
  // Format date to Indonesian format (e.g. Kamis, 27 Agustus 2026)
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getStatusColor = (status) => {
    if (status && status.toLowerCase() === 'baik') {
      return '#16a34a'; // green
    }
    return '#dc2626'; // red for anything else
  };

  return (
    <div 
      ref={ref} 
      style={{
        width: '1400px',
        backgroundColor: '#ffffff',
        color: '#333333',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        padding: '0 0 100px 0',
        boxSizing: 'border-box'
      }}
    >
      {/* Header Image */}
      {odometerPhoto && (
        <div style={{ width: '100%', height: '700px', backgroundColor: '#000', overflow: 'hidden' }}>
          <img 
            src={odometerPhoto} 
            alt="Odometer" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      <div style={{ padding: '80px 80px 0 80px' }}>
        <h1 style={{ color: '#111827', fontSize: '72px', margin: '0 0 50px 0', letterSpacing: '1.5px', borderBottom: '4px solid #e5e7eb', paddingBottom: '30px', fontWeight: '900' }}>
          CARLOG HEAVY EQUIPMENT
        </h1>

        {/* General Info */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '100px', fontSize: '38px', color: '#4b5563' }}>
          <tbody>
            <tr>
              <td style={{ padding: '16px 0', width: '450px' }}>Hari, Tanggal</td>
              <td style={{ padding: '16px 20px', width: '50px' }}>:</td>
              <td style={{ padding: '16px 0', color: '#111827' }}>{formatDate(formData.date)}</td>
            </tr>
            <tr>
              <td style={{ padding: '16px 0' }}>Shift No</td>
              <td style={{ padding: '16px 20px' }}>:</td>
              <td style={{ padding: '16px 0', color: '#111827' }}>{formData.shift}</td>
            </tr>
            <tr>
              <td style={{ padding: '16px 0' }}>Operator</td>
              <td style={{ padding: '16px 20px' }}>:</td>
              <td style={{ padding: '16px 0', color: '#111827', fontWeight: 'bold' }}>{formData.operator}</td>
            </tr>
            <tr>
              <td style={{ padding: '16px 0' }}>Nomor Unit</td>
              <td style={{ padding: '16px 20px' }}>:</td>
              <td style={{ padding: '16px 0', color: '#2563eb', fontWeight: '900' }}>{formData.unitNo}</td>
            </tr>
            <tr>
              <td style={{ padding: '16px 0' }}>Submitted By</td>
              <td style={{ padding: '16px 20px' }}>:</td>
              <td style={{ padding: '16px 0', color: '#111827' }}>{(formData.submittedBy || formData.operator).toUpperCase()}</td>
            </tr>
          </tbody>
        </table>

        {/* 1. ITEM CHECKLIST */}
        <h2 style={{ color: '#111827', fontSize: '48px', margin: '0 0 40px 0', fontWeight: '900' }}>1. ITEM CHECKLIST</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '100px', fontSize: '38px', color: '#4b5563' }}>
          <tbody>
            {CHECKLIST_ITEMS.map((item, index) => {
              const checkData = checklists[item] || { status: '-', notes: '' };
              let displayStatus = checkData.status;
              if (displayStatus === 'Others') displayStatus = checkData.notes || 'Others';
              
              return (
                <tr key={item}>
                  <td style={{ padding: '16px 0', width: '550px' }}>1.{index + 1}. {item}</td>
                  <td style={{ padding: '16px 20px', width: '50px' }}>:</td>
                  <td style={{ padding: '16px 0', color: getStatusColor(displayStatus), fontWeight: 'bold' }}>
                    {displayStatus}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 2. OPERASIONAL UNIT */}
        <h2 style={{ color: '#111827', fontSize: '48px', margin: '0 0 40px 0', fontWeight: '900' }}>2. OPERASIONAL UNIT</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '100px', fontSize: '38px', color: '#4b5563' }}>
          <tbody>
            <tr>
              <td style={{ padding: '16px 0', width: '550px' }}>2.1. HM Awal</td>
              <td style={{ padding: '16px 20px', width: '50px' }}>:</td>
              <td style={{ padding: '16px 0', color: '#111827' }}>{operasional.hmAwal || '-'}</td>
            </tr>
            <tr>
              <td style={{ padding: '16px 0' }}>2.2. HM Akhir</td>
              <td style={{ padding: '16px 20px' }}>:</td>
              <td style={{ padding: '16px 0', color: '#111827' }}>{operasional.hmAkhir || '-'}</td>
            </tr>
            <tr>
              <td style={{ padding: '16px 0' }}>2.3. Odometer Awal</td>
              <td style={{ padding: '16px 20px' }}>:</td>
              <td style={{ padding: '16px 0', color: '#111827' }}>{operasional.odoAwal || '-'}</td>
            </tr>
            <tr>
              <td style={{ padding: '16px 0' }}>2.4. Odometer Akhir</td>
              <td style={{ padding: '16px 20px' }}>:</td>
              <td style={{ padding: '16px 0', color: '#111827' }}>{operasional.odoAkhir || '-'}</td>
            </tr>
            <tr>
              <td style={{ padding: '16px 0' }}>2.5. Total Odometer</td>
              <td style={{ padding: '16px 20px' }}>:</td>
              <td style={{ padding: '16px 0', color: '#111827', fontWeight: 'bold' }}>
                {(operasional.odoAkhir && operasional.odoAwal) 
                  ? (parseFloat(operasional.odoAkhir) - parseFloat(operasional.odoAwal)).toFixed(1) 
                  : '-'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '16px 0' }}>2.6. Charging Durasi</td>
              <td style={{ padding: '16px 20px' }}>:</td>
              <td style={{ padding: '16px 0', color: '#111827' }}>{operasional.chargingTotal || '-'}</td>
            </tr>
          </tbody>
        </table>

        {/* 3. LAPORAN KEGIATAN */}
        <h2 style={{ color: '#111827', fontSize: '48px', margin: '0 0 40px 0', fontWeight: '900' }}>3. LAPORAN KEGIATAN</h2>
        <div style={{ fontSize: '38px', color: '#4b5563' }}>
          {activities && activities.length > 0 ? (
            activities.map((act, index) => (
              <div key={index} style={{ marginBottom: '24px', lineHeight: '1.6' }}>
                <span style={{ color: '#16a34a', fontWeight: 'bold' }}>[{act.jamMulai} - {act.jamSelesai}]</span>
                <span style={{ color: '#111827', fontWeight: '500' }}> • {act.deskripsi}</span>
              </div>
            ))
          ) : (
            <div style={{ color: '#111827' }}>-</div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ExportPngTemplate;
