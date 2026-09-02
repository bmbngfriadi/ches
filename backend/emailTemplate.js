const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getStatusColor = (status) => {
  if (status && status.toLowerCase() === 'baik') return '#16A34A'; // Green
  if (status && status.toLowerCase() === 'rusak') return '#DC2626'; // Red
  return '#D97706'; // Orange for others
};

const getStatusBgColor = (status) => {
  if (status && status.toLowerCase() === 'baik') return '#DCFCE7'; // Light Green
  if (status && status.toLowerCase() === 'rusak') return '#FEE2E2'; // Light Red
  return '#FEF3C7'; // Light Orange
};

const generateCardlogEmailHtml = (cardlog, activitiesData, submitterNameParam) => {
  const submitterName = submitterNameParam || cardlog.submitter_name || cardlog.operator;
  
  const checklistItems = [
    { key: 'lampu_depan', label: 'Lampu Depan' },
    { key: 'lampu_belakang', label: 'Lampu Belakang' },
    { key: 'ban_depan', label: 'Ban Depan' },
    { key: 'ban_belakang', label: 'Ban Belakang' },
    { key: 'klakson', label: 'Klakson' },
    { key: 'alarm_mundur', label: 'Alarm Mundur' },
    { key: 'rem_jalan', label: 'Rem Jalan' },
    { key: 'rem_parkir', label: 'Rem Parkir' },
    { key: 'sabuk_pengaman', label: 'Sabuk Pengaman' },
    { key: 'kebersihan', label: 'Kebersihan' }
  ];

  const activities = activitiesData || cardlog.activities || [];

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cardlog Report - ${cardlog.unit_no}</title>
  <style>
    /* Reset */
    body, p, h1, h2, h3, h4, h5, h6, table, td {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Arial, sans-serif;
    }
    body {
      background-color: #F3F4F6;
      color: #374151;
      -webkit-font-smoothing: antialiased;
    }
  </style>
</head>
<body style="background-color: #F3F4F6; padding: 20px 0;">

  <!-- Main Container -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F3F4F6;">
    <tr>
      <td align="center">
        <!--[if mso]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
        <tr>
        <td align="center" valign="top" width="600">
        <![endif]-->
        
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #B52025; padding: 30px 40px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: 0.5px;">Cardlog Heavy Equipment</h1>
              <p style="color: #FCA5A5; font-size: 14px; margin-top: 5px;">Operational Report Summary</p>
            </td>
          </tr>

          <!-- Intro & Meta -->
          <tr>
            <td style="padding: 30px 40px;">
              <p style="font-size: 15px; line-height: 24px; color: #4B5563; margin-bottom: 25px;">
                Laporan operasional baru telah berhasil disubmit ke sistem. Berikut adalah rincian data unit alat berat:
              </p>

              <!-- Meta Grid (Simulated with Table) -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 6px;">
                <tr>
                  <td width="260" valign="top" style="width: 260px; padding: 15px 20px; border-bottom: 1px solid #E5E7EB; border-right: 1px solid #E5E7EB;">
                    <p style="font-size: 11px; text-transform: uppercase; color: #6B7280; font-weight: 600; letter-spacing: 0.5px;">Tanggal</p>
                    <p style="font-size: 14px; color: #111827; font-weight: 600; margin-top: 4px;">${formatDate(cardlog.date)}</p>
                  </td>
                  <td width="260" valign="top" style="width: 260px; padding: 15px 20px; border-bottom: 1px solid #E5E7EB;">
                    <p style="font-size: 11px; text-transform: uppercase; color: #6B7280; font-weight: 600; letter-spacing: 0.5px;">Unit No</p>
                    <p style="font-size: 14px; color: #B52025; font-weight: 700; margin-top: 4px;">${cardlog.unit_no}</p>
                  </td>
                </tr>
                <tr>
                  <td width="260" valign="top" style="width: 260px; padding: 15px 20px; border-right: 1px solid #E5E7EB;">
                    <p style="font-size: 11px; text-transform: uppercase; color: #6B7280; font-weight: 600; letter-spacing: 0.5px;">Operator</p>
                    <p style="font-size: 14px; color: #111827; font-weight: 600; margin-top: 4px;">${cardlog.operator}</p>
                  </td>
                  <td width="260" valign="top" style="width: 260px; padding: 15px 20px;">
                    <p style="font-size: 11px; text-transform: uppercase; color: #6B7280; font-weight: 600; letter-spacing: 0.5px;">Shift</p>
                    <p style="font-size: 14px; color: #111827; font-weight: 600; margin-top: 4px;">${cardlog.shift_no}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Section Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr><td style="border-top: 2px solid #F3F4F6;"></td></tr>
              </table>
            </td>
          </tr>

          <!-- P2H Checklist -->
          <tr>
            <td style="padding: 30px 40px;">
              <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 20px;">Pelaksanaan Perawatan Harian (P2H)</h2>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                ${checklistItems.map((item, index) => {
                  const status = cardlog[item.key] || '-';
                  const isLast = index === checklistItems.length - 1;
                  return `
                  <tr>
                    <td style="padding: 12px 0; border-bottom: ${isLast ? 'none' : '1px solid #F3F4F6'};">
                      <p style="font-size: 14px; color: #4B5563;">${item.label}</p>
                    </td>
                    <td align="right" style="padding: 12px 0; border-bottom: ${isLast ? 'none' : '1px solid #F3F4F6'};">
                      <table border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background-color: ${getStatusBgColor(status)}; border-radius: 4px; padding: 4px 10px;">
                            <p style="font-size: 12px; font-weight: 700; color: ${getStatusColor(status)};">${status}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  `;
                }).join('')}
              </table>
            </td>
          </tr>

          <!-- Section Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr><td style="border-top: 2px solid #F3F4F6;"></td></tr>
              </table>
            </td>
          </tr>

          <!-- Operasional Unit & Photo -->
          <tr>
            <td style="padding: 30px 40px;">
              <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 20px;">Meteran Operasional</h2>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <!-- Stats -->
                  <td width="300" valign="top" style="width: 300px; padding-right: 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 15px;">
                          <p style="font-size: 12px; color: #6B7280; margin-bottom: 2px;">HM Awal - Akhir</p>
                          <p style="font-size: 15px; font-weight: 600; color: #111827;">${cardlog.hm_awal || 0} <span style="color: #9CA3AF;">&rarr;</span> ${cardlog.hm_akhir || 0}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 15px;">
                          <p style="font-size: 12px; color: #6B7280; margin-bottom: 2px;">Odo Awal - Akhir</p>
                          <p style="font-size: 15px; font-weight: 600; color: #111827;">${cardlog.odometer_awal || 0} <span style="color: #9CA3AF;">&rarr;</span> ${cardlog.odometer_akhir || 0}</p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td width="50%">
                                <p style="font-size: 12px; color: #6B7280; margin-bottom: 2px;">Total HM</p>
                                <p style="font-size: 15px; font-weight: 600; color: #111827;">${((cardlog.hm_akhir || 0) - (cardlog.hm_awal || 0)).toFixed(1)} <span style="font-size: 11px; color: #6B7280; font-weight: normal;">jam</span></p>
                              </td>
                              <td width="50%">
                                <p style="font-size: 12px; color: #6B7280; margin-bottom: 2px;">Total Odometer</p>
                                <p style="font-size: 15px; font-weight: 600; color: #B52025;">${((cardlog.odometer_akhir || 0) - (cardlog.odometer_awal || 0)).toFixed(1)} <span style="font-size: 11px; color: #6B7280; font-weight: normal;">km</span></p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                  
                  <!-- Photo Notice -->
                  <td width="220" valign="top" style="width: 220px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center" style="background-color: #F9FAFB; border: 1px dashed #D1D5DB; border-radius: 6px; padding: 30px 15px;">
                          <p style="font-size: 13px; color: #4B5563; text-align: center; line-height: 20px;">
                            ${cardlog.odometer_photo ? 
                              `<span style="font-size: 20px;">📷</span><br><br>Terdapat lampiran foto HM.<br><strong style="color: #111827;">Silakan login ke sistem untuk melihat gambar.</strong>` : 
                              `Tidak ada foto dilampirkan`
                            }
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Section Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr><td style="border-top: 2px solid #F3F4F6;"></td></tr>
              </table>
            </td>
          </tr>

          <!-- Laporan Kegiatan -->
          <tr>
            <td style="padding: 30px 40px;">
              <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 20px;">Laporan Kegiatan</h2>
              
              ${activities.length > 0 ? `
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  ${activities.map((act, idx) => `
                    <tr>
                      <td width="100" valign="top" style="padding-bottom: ${idx === activities.length -1 ? '0' : '15px'};">
                        <table border="0" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="background-color: #F3F4F6; border-radius: 4px; padding: 4px 8px;">
                              <p style="font-size: 12px; font-weight: 600; color: #4B5563;">${act.jam_mulai} - ${act.jam_selesai}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td valign="top" style="padding-bottom: ${idx === activities.length -1 ? '0' : '15px'}; padding-left: 15px;">
                        <p style="font-size: 14px; color: #374151; line-height: 20px;">${act.deskripsi}</p>
                      </td>
                    </tr>
                  `).join('')}
                </table>
              ` : `
                <p style="font-size: 14px; color: #6B7280; font-style: italic;">Tidak ada riwayat laporan kegiatan.</p>
              `}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 25px 40px; border-top: 1px solid #E5E7EB;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left">
                    <p style="font-size: 12px; color: #6B7280; margin-bottom: 4px;">Disubmit oleh: <strong>${submitterName}</strong></p>
                    <p style="font-size: 11px; color: #9CA3AF;">Email ini di-*generate* otomatis oleh Sistem Cardlog CHES.</p>
                  </td>
                  <td align="right" valign="bottom">
                    <!-- Status Removed -->
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
};

module.exports = { generateCardlogEmailHtml };
