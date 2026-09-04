const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendMail } = require('./mailer');
const { generateCardlogEmailHtml } = require('./emailTemplate');
require('dotenv').config({ override: true });
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Middleware
app.use(cors());
app.use((req, res, next) => {
  const fs = require('fs');
  fs.appendFileSync('requests.log', `${new Date().toISOString()} - ${req.method} ${req.originalUrl}\n`);
  next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Debug route
app.get('/api/ping-db', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', message: 'Database connected successfully' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message, code: err.code, stack: err.stack });
  }
});

// Add role column if it doesn't exist (Migration)
(async () => {
  try {
    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT \'user\'');
    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT');
    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE');
    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255)');
    await db.query('ALTER TABLE cardlogs ADD COLUMN IF NOT EXISTS odometer_photo TEXT');
    await db.query('ALTER TABLE cardlogs ADD COLUMN IF NOT EXISTS charging_mulai VARCHAR(10)');
    await db.query('ALTER TABLE cardlogs ADD COLUMN IF NOT EXISTS charging_selesai VARCHAR(10)');
    
    // Add 1 hour limit permission (id 6)
    await db.query("INSERT INTO permissions (id, name) VALUES (6, 'cardlog_edit_1h') ON CONFLICT (id) DO NOTHING");
    // Add resend email notification permission (id 10)
    await db.query("INSERT INTO permissions (id, name) VALUES (10, 'resend_email_notification') ON CONFLICT (id) DO NOTHING");
    
    console.log('Database schema verified.');
  } catch (err) {
    console.error('Migration error:', err);
  }
})();

// --- ROUTES ---

// 1. Auth Login (Dummy/Basic Implementation for now)
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  try {
    // In a real app, you would compare hash with bcrypt
    const result = await db.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1) OR (LOWER(email) = LOWER($1) AND email IS NOT NULL AND email != \'\')', [username]);
    
    // For demo/setup purposes: if admin user is not found, we create it dynamically
    if (result.rows.length === 0 && username === 'admin' && password === 'admin') {
       const insertResult = await db.query(
         'INSERT INTO users (username, password, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id',
         ['admin', 'admin', 'Administrator', 'administrator/dev']
       );
       const adminId = insertResult.rows[0].id;
       const token = jwt.sign({ id: adminId, username: 'admin', role: 'administrator/dev' }, JWT_SECRET, { expiresIn: '1d' });
       return res.json({ token, user: { id: adminId, username: 'admin', fullName: 'Administrator', role: 'administrator/dev' }});
    }

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Email, Username, atau Password yang Anda masukkan salah. Silakan cek kembali dan coba login lagi.' });
    }

    const user = result.rows[0];
    if (user.password !== password) { // AGAIN: use bcrypt.compare in production!
      return res.status(401).json({ message: 'Email, Username, atau Password yang Anda masukkan salah. Silakan cek kembali dan coba login lagi.' });
    }

    if (user.email_verified === false) {
      return res.status(403).json({ message: 'Silakan verifikasi email Anda terlebih dahulu.' });
    }

    const permRes = await db.query(
      'SELECT p.name FROM permissions p JOIN user_permissions up ON p.id = up.permission_id WHERE up.user_id = $1',
      [user.id]
    );
    const permissions = permRes.rows.map(r => r.name);

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role || 'user', permissions }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, username: user.username, full_name: user.full_name, email: user.email, role: user.role || 'user', permissions, profile_photo: user.profile_photo }});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware for checking Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// 1.1 Register
app.post('/api/auth/register', async (req, res) => {
  const { username, password, full_name, email } = req.body || {};
  try {
    const existing = await db.query('SELECT id FROM users WHERE username = $1 OR (email = $2 AND email IS NOT NULL AND email != \'\')', [username, email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Username atau Email sudah terdaftar.' });
    }

    const verifyToken = crypto.randomBytes(32).toString('hex');
    const role = 'operator';

    const insertResult = await db.query(
      'INSERT INTO users (username, password, full_name, email, role, email_verified, verification_token) VALUES ($1, $2, $3, $4, $5, FALSE, $6) RETURNING id',
      [username, password, full_name, email, role, verifyToken]
    );
    const newUserId = insertResult.rows[0].id;

    // Assign default operator permissions
    const defaultPerms = ['cardlog_view', 'cardlog_add', 'cardlog_export_png', 'cardlog_edit_1h', 'receive_email_notification'];
    const permResult = await db.query('SELECT id FROM permissions WHERE name = ANY($1)', [defaultPerms]);
    
    for (const perm of permResult.rows) {
      await db.query('INSERT INTO user_permissions (user_id, permission_id) VALUES ($1, $2)', [newUserId, perm.id]);
    }

    // Use the origin from the request to generate the link, falling back to production url
    const frontendUrl = req.headers.origin || 'https://cg-plantbatam.com';
    const verifyUrl = `${frontendUrl}/#/verify-email/${verifyToken}`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Verifikasi Email CHES</h2>
        <p>Halo ${full_name},</p>
        <p>Terima kasih telah mendaftar di CHES. Silakan klik tombol di bawah ini untuk memverifikasi alamat email Anda agar dapat login:</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background-color: #b52025; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0;">Verifikasi Email</a>
        <p>Jika tautan tidak berfungsi, salin dan tempel URL berikut ke browser Anda: <br/><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
      </div>
    `;

    await sendMail(email, 'CHES - Verifikasi Email Anda', html);
    res.status(201).json({ message: 'Registrasi berhasil. Silakan cek email Anda untuk verifikasi.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal melakukan registrasi.' });
  }
});

// 1.1b Verify Email (API endpoint)
app.post('/api/auth/verify-email', async (req, res) => {
  const { token } = req.body || {};
  try {
    const user = await db.query('SELECT id FROM users WHERE verification_token = $1', [token]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Token tidak valid atau email sudah terverifikasi.' });
    }

    await db.query('UPDATE users SET email_verified = TRUE, verification_token = NULL WHERE id = $1', [user.rows[0].id]);
    
    res.status(200).json({ message: 'Email Anda telah berhasil diverifikasi. Silakan login untuk melanjutkan.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan sistem saat memverifikasi email.' });
  }
});

// 1.2 Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  try {
    const user = await db.query('SELECT id, full_name FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'Email tidak terdaftar.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await db.query('UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3', [resetToken, expiry, email]);

    const frontendUrl = req.headers.origin || 'https://cg-plantbatam.com/ches';
    const resetUrl = `${frontendUrl}/#/reset-password/${resetToken}`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Reset Password</h2>
        <p>Halo ${user.rows[0].full_name},</p>
        <p>Anda meminta untuk mereset password akun CHES Anda. Silakan klik tombol di bawah ini untuk membuat password baru:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #b52025; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0;">Reset Password</a>
        <p>Tautan ini akan kedaluwarsa dalam 1 jam.</p>
        <p>Jika Anda tidak merasa meminta reset password, abaikan email ini.</p>
      </div>
    `;

    await sendMail(email, 'CHES - Reset Password', html);
    res.json({ message: 'Email reset password telah dikirim.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memproses permintaan.' });
  }
});

// 1.3 Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body || {};
  try {
    const user = await db.query('SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()', [token]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Token reset password tidak valid atau telah kedaluwarsa.' });
    }

    await db.query('UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2', [newPassword, user.rows[0].id]);
    res.json({ message: 'Password berhasil diubah. Silakan login.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mereset password.' });
  }
});

// 2. Fetch Cardlogs
app.get('/api/cardlogs', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT c.*, EXTRACT(EPOCH FROM (NOW() - c.created_at))/60 AS age_minutes, u.full_name AS submitted_by_name FROM cardlogs c LEFT JOIN users u ON c.created_by = u.id ORDER BY c.created_at DESC');
    const logs = result.rows;
    
    const activitiesResult = await db.query('SELECT * FROM cardlog_activities');
    const activities = activitiesResult.rows;

    const activitiesByCardlog = activities.reduce((acc, act) => {
      if (!acc[act.cardlog_id]) acc[act.cardlog_id] = [];
      acc[act.cardlog_id].push(act);
      return acc;
    }, {});

    logs.forEach(log => {
      log.activities = activitiesByCardlog[log.id] || [];
    });

    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching cardlogs' });
  }
});

// Fetch last operasional data for a specific unit
app.get('/api/cardlogs/last-operasional/:unitNo', authenticateToken, async (req, res) => {
  const { unitNo } = req.params;
  try {
    const result = await db.query(
      'SELECT hm_akhir, odometer_akhir FROM cardlogs WHERE unit_no = $1 ORDER BY created_at DESC LIMIT 1',
      [unitNo]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.json({ hm_akhir: '', odometer_akhir: '' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching last operasional' });
  }
});

// 3. Create Cardlog
app.post('/api/cardlogs', authenticateToken, async (req, res) => {
  const { date, shift, operator, unitNo, checklists, operasional, activities, odometerPhoto } = req.body;
  
  try {
    await db.query('BEGIN');
    
    // Insert Header & Operasional
    const cardlogInsertQuery = `
      INSERT INTO cardlogs (
        date, shift_no, operator, unit_no, 
        lampu_depan, lampu_belakang, ban_depan, ban_belakang, klakson, alarm_mundur, rem_jalan, rem_parkir, sabuk_pengaman, kebersihan,
        hm_awal, hm_akhir, odometer_awal, odometer_akhir, charging_durasi, charging_mulai, charging_selesai, created_by, odometer_photo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23) RETURNING id
    `;
    
    // Simplification for checklists extraction (combining status and notes into a string or just taking status if no notes)
    const getChecklistVal = (key) => {
      if (!checklists || !checklists[key]) return 'Baik'; // Default fallback
      return checklists[key].status === 'Others' ? checklists[key].notes : checklists[key].status;
    };

    const values = [
      date, shift, operator, unitNo,
      getChecklistVal('Lampu Depan'), getChecklistVal('Lampu Belakang'), getChecklistVal('Ban Depan'), getChecklistVal('Ban Belakang'),
      getChecklistVal('Klakson'), getChecklistVal('Alarm Mundur'), getChecklistVal('Rem Jalan'), getChecklistVal('Rem Parkir'),
      getChecklistVal('Sabuk Pengaman'), getChecklistVal('Kebersihan'),
      operasional.hmAwal || 0, operasional.hmAkhir || 0, operasional.odoAwal || 0, operasional.odoAkhir || 0, operasional.charging || 0,
      operasional.chargingMulai || null, operasional.chargingSelesai || null,
      req.user.id,
      odometerPhoto || null
    ];

    const cardlogResult = await db.query(cardlogInsertQuery, values);
    const cardlogId = cardlogResult.rows[0].id;

    // Insert Activities
    if (activities && activities.length > 0) {
      for (const act of activities) {
        if (act.jamMulai && act.jamSelesai && act.deskripsi) {
          await db.query(
            'INSERT INTO cardlog_activities (cardlog_id, jam_mulai, jam_selesai, deskripsi) VALUES ($1, $2, $3, $4)',
            [cardlogId, act.jamMulai, act.jamSelesai, act.deskripsi]
          );
        }
      }
    }

    await db.query('COMMIT');
    res.status(201).json({ message: 'Cardlog saved successfully', cardlogId });

    // Send email notifications asynchronously
    setImmediate(async () => {
      try {
        const notifUsers = await db.query('SELECT email, full_name FROM users u JOIN user_permissions up ON u.id = up.user_id WHERE up.permission_id = 9 AND email IS NOT NULL AND email != \'\'');
        if (notifUsers.rows.length > 0) {
          const emails = notifUsers.rows.map(r => r.email).join(', ');
          const newlyInserted = await db.query('SELECT c.*, u.full_name AS submitter_name FROM cardlogs c LEFT JOIN users u ON c.created_by = u.id WHERE c.id = $1', [cardlogId]);
          const newActs = await db.query('SELECT * FROM cardlog_activities WHERE cardlog_id = $1', [cardlogId]);
          const html = generateCardlogEmailHtml(newlyInserted.rows[0], newActs.rows);
          await sendMail(emails, `[CHES] Cardlog Baru: Unit ${unitNo}`, html);
        }
      } catch (err) {
        console.error('Failed to send new cardlog notification', err);
      }
    });

  } catch (err) {
    await db.query('ROLLBACK');
    console.error('DB Error:', err);
    res.status(500).json({ message: err.message || 'Error saving cardlog' });
  }
});

// Fetch Cardlog Activities
app.get('/api/cardlogs/:id/activities', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM cardlog_activities WHERE cardlog_id = $1 ORDER BY id ASC', [id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching cardlog activities' });
  }
});

// 3.1 Update Cardlog
app.put('/api/cardlogs/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { date, shift, operator, unitNo, checklists, operasional, activities, odometerPhoto } = req.body;
  
  try {
    const isAdmin = req.user.role === 'administrator/dev';
    const hasUnlimitedEdit = req.user.permissions.includes('cardlog_edit');
    const has1hEdit = req.user.permissions.includes('cardlog_edit_1h');

    if (!isAdmin) {
      if (!hasUnlimitedEdit && !has1hEdit) {
        return res.status(403).json({ message: 'Anda tidak memiliki akses untuk mengedit data ini.' });
      }

      if (has1hEdit && !hasUnlimitedEdit) {
        const existing = await db.query('SELECT created_at FROM cardlogs WHERE id = $1', [id]);
        if (existing.rows.length > 0) {
          // Compare using DB time to avoid Node vs DB timezone issues
          const timeCheck = await db.query('SELECT EXTRACT(EPOCH FROM (NOW() - $1))/60 AS diff', [existing.rows[0].created_at]);
          const diffMinutes = parseFloat(timeCheck.rows[0].diff);
          if (diffMinutes > 60) {
            return res.status(403).json({ message: 'Batas waktu edit (1 jam) telah berakhir.' });
          }
        }
      }
    }

    await db.query('BEGIN');
    
    const getChecklistVal = (key) => {
      if (!checklists || !checklists[key]) return 'Baik';
      return checklists[key].status === 'Others' ? checklists[key].notes : checklists[key].status;
    };

    const updateQuery = `
      UPDATE cardlogs SET 
        date = $1, shift_no = $2, operator = $3, unit_no = $4,
        lampu_depan = $5, lampu_belakang = $6, ban_depan = $7, ban_belakang = $8, klakson = $9, alarm_mundur = $10, rem_jalan = $11, rem_parkir = $12, sabuk_pengaman = $13, kebersihan = $14,
        hm_awal = $15, hm_akhir = $16, odometer_awal = $17, odometer_akhir = $18, charging_durasi = $19, charging_mulai = $20, charging_selesai = $21,
        odometer_photo = COALESCE($22, odometer_photo), updated_at = CURRENT_TIMESTAMP
      WHERE id = $23
    `;
    const values = [
      date, shift, operator, unitNo,
      getChecklistVal('Lampu Depan'), getChecklistVal('Lampu Belakang'), getChecklistVal('Ban Depan'), getChecklistVal('Ban Belakang'),
      getChecklistVal('Klakson'), getChecklistVal('Alarm Mundur'), getChecklistVal('Rem Jalan'), getChecklistVal('Rem Parkir'),
      getChecklistVal('Sabuk Pengaman'), getChecklistVal('Kebersihan'),
      operasional.hmAwal || 0, operasional.hmAkhir || 0, operasional.odoAwal || 0, operasional.odoAkhir || 0, operasional.charging || 0,
      operasional.chargingMulai || null, operasional.chargingSelesai || null,
      odometerPhoto || null,
      id
    ];
    await db.query(updateQuery, values);

    // Update Activities: delete old and insert new
    await db.query('DELETE FROM cardlog_activities WHERE cardlog_id = $1', [id]);
    if (activities && activities.length > 0) {
      for (const act of activities) {
        if (act.jamMulai && act.jamSelesai && act.deskripsi) {
          await db.query(
            'INSERT INTO cardlog_activities (cardlog_id, jam_mulai, jam_selesai, deskripsi) VALUES ($1, $2, $3, $4)',
            [id, act.jamMulai, act.jamSelesai, act.deskripsi]
          );
        }
      }
    }
    
    await db.query('COMMIT');
    res.json({ message: 'Cardlog updated successfully' });

    // Send email notifications asynchronously
    setImmediate(async () => {
      try {
        const notifUsers = await db.query('SELECT email, full_name FROM users u JOIN user_permissions up ON u.id = up.user_id WHERE up.permission_id = 9 AND email IS NOT NULL AND email != \'\'');
        if (notifUsers.rows.length > 0) {
          const emails = notifUsers.rows.map(r => r.email).join(', ');
          const updatedRow = await db.query('SELECT * FROM cardlogs WHERE id = $1', [id]);
          const upActs = await db.query('SELECT * FROM cardlog_activities WHERE cardlog_id = $1', [id]);
          const html = generateCardlogEmailHtml(updatedRow.rows[0], upActs.rows, req.user.full_name, true, false);
          await sendMail(emails, `[CHES] Update Cardlog: Unit ${unitNo}`, html);
        }
      } catch (err) {
        console.error('Failed to send update cardlog notification', err);
      }
    });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('DB Error:', err);
    res.status(500).json({ message: err.message || 'Error updating cardlog' });
  }
});

// 3.2 Delete Cardlog
app.delete('/api/cardlogs/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM cardlogs WHERE id = $1', [id]);
    res.json({ message: 'Cardlog deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting cardlog' });
  }
});


// 3.3 Resend Email Notification
app.post('/api/cardlogs/:id/resend-email', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  if (!req.user.permissions.includes('resend_email_notification') && req.user.role !== 'administrator/dev') {
    return res.status(403).json({ message: 'Akses ditolak. Anda tidak memiliki izin.' });
  }

  try {
    const cardlogRes = await db.query('SELECT c.*, u.full_name AS submitter_name FROM cardlogs c LEFT JOIN users u ON c.created_by = u.id WHERE c.id = $1', [id]);
    if (cardlogRes.rows.length === 0) {
      return res.status(404).json({ message: 'Data cardlog tidak ditemukan' });
    }
    const cardlog = cardlogRes.rows[0];

    const notifUsers = await db.query('SELECT email FROM users u JOIN user_permissions up ON u.id = up.user_id WHERE up.permission_id = 9 AND email IS NOT NULL AND email != \'\'');
    if (notifUsers.rows.length === 0) {
      return res.status(400).json({ message: 'Tidak ada user yang disetting untuk menerima notifikasi.' });
    }

    const emails = notifUsers.rows.map(r => r.email).join(', ');
    const resendActs = await db.query('SELECT * FROM cardlog_activities WHERE cardlog_id = $1', [id]);
    const html = generateCardlogEmailHtml(cardlog, resendActs.rows, req.user.full_name, false, true);

    await sendMail(emails, `[CHES] Resend Notifikasi Cardlog: Unit ${cardlog.unit_no}`, html);
    res.json({ message: 'Email notifikasi berhasil dikirim ulang.' });
  } catch (err) {
    console.error('Resend email error:', err);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengirim ulang email.' });
  }
});

// 4. User Management APIs

app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        u.id, u.username, u.full_name, u.email, u.role, u.created_at, 
        COALESCE(json_agg(up.permission_id) FILTER (WHERE up.permission_id IS NOT NULL), '[]') as permissions 
      FROM users u 
      LEFT JOIN user_permissions up ON u.id = up.user_id 
      GROUP BY u.id 
      ORDER BY u.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

app.post('/api/users', authenticateToken, async (req, res) => {
  const { username, password, full_name, email, permissions } = req.body || {};
  try {
    await db.query('BEGIN');
    
    // Check if user exists
    const existing = await db.query('SELECT id FROM users WHERE username = $1 OR (email = $2 AND email IS NOT NULL AND email != \'\')', [username, email || null]);
    if (existing.rows.length > 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({ message: 'Username or Email already exists' });
    }

    // Insert user (auto verified since created by admin)
    const userRes = await db.query(
      'INSERT INTO users (username, password, full_name, email, email_verified) VALUES ($1, $2, $3, $4, TRUE) RETURNING id',
      [username, password, full_name, email || null]
    );
    const userId = userRes.rows[0].id;

    // Insert permissions
    if (permissions && permissions.length > 0) {
      for (const permId of permissions) {
        await db.query(
          'INSERT INTO user_permissions (user_id, permission_id) VALUES ($1, $2)',
          [userId, permId]
        );
      }
    }

    await db.query('COMMIT');
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Error creating user' });
  }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { password, email, permissions, username, full_name, role_id, is_active } = req.body || {};
  if (req.user.role !== 'administrator/dev') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  try {
    await db.query('BEGIN');
    
    // Update username if provided
    if (username && username.trim() !== '') {
      const existingUser = await db.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, id]);
      if (existingUser.rows.length > 0) {
        await db.query('ROLLBACK');
        return res.status(400).json({ message: 'Username already taken' });
      }
      await db.query('UPDATE users SET username = $1 WHERE id = $2', [username, id]);
    }

    // Update full_name if provided
    if (full_name && full_name.trim() !== '') {
      await db.query('UPDATE users SET full_name = $1 WHERE id = $2', [full_name, id]);
    }

    // Update password if provided
    if (password && password.trim() !== '') {
      await db.query('UPDATE users SET password = $1 WHERE id = $2', [password, id]);
    }

    // Update email if provided
    if (email !== undefined) {
      // Check if email already used by another user
      if (email.trim() !== '') {
        const existingEmail = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
        if (existingEmail.rows.length > 0) {
          await db.query('ROLLBACK');
          return res.status(400).json({ message: 'Email already in use' });
        }
      }
      await db.query('UPDATE users SET email = $1 WHERE id = $2', [email || null, id]);
    }

    // Update role_id if provided
    if (role_id !== undefined) {
      await db.query('UPDATE users SET role_id = $1 WHERE id = $2', [role_id, id]);
    }

    // Update is_active if provided
    if (is_active !== undefined) {
      await db.query('UPDATE users SET is_active = $1 WHERE id = $2', [is_active, id]);
    }

    // Update permissions
    if (permissions !== undefined) {
      // delete existing
      await db.query('DELETE FROM user_permissions WHERE user_id = $1', [id]);
      // insert new
      for (const permId of permissions) {
        await db.query('INSERT INTO user_permissions (user_id, permission_id) VALUES ($1, $2)', [id, permId]);
      }
    }

    await db.query('COMMIT');
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Error updating user' });
  }
});

// Update own profile
app.put('/api/users/profile/update', authenticateToken, async (req, res) => {
  const { password, profile_photo } = req.body || {};
  const userId = req.user.id;
  try {
    if (password && profile_photo) {
      await db.query('UPDATE users SET password = $1, profile_photo = $2 WHERE id = $3', [password, profile_photo, userId]);
    } else if (password) {
      await db.query('UPDATE users SET password = $1 WHERE id = $2', [password, userId]);
    } else if (profile_photo) {
      await db.query('UPDATE users SET profile_photo = $1 WHERE id = $2', [profile_photo, userId]);
    }
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

app.put('/api/users/:id/role', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body || {};
  if (req.user.role !== 'administrator/dev') {
    return res.status(403).json({ message: 'Access denied: Only administrators can change roles' });
  }
  try {
    await db.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
    res.json({ message: 'User role updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating user role' });
  }
});


app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
