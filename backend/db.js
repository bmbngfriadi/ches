const { Pool } = require('pg');
require('dotenv').config({ override: true });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Gamaadmin53',
  database: process.env.DB_NAME || 'ches_prod',
  port: process.env.DB_PORT || 5432,
});

const initDb = async () => {
  try {
    // Full auto-migration to ensure all tables exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          full_name VARCHAR(100) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          photo_url VARCHAR(255),
          email VARCHAR(255) UNIQUE,
          role VARCHAR(50) DEFAULT 'operator',
          email_verified BOOLEAN DEFAULT FALSE,
          verification_token VARCHAR(255)
      );

      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
      ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'operator',
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);

      CREATE TABLE IF NOT EXISTS permissions (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) UNIQUE NOT NULL,
          description TEXT
      );

      CREATE TABLE IF NOT EXISTS user_permissions (
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
          PRIMARY KEY (user_id, permission_id)
      );

      CREATE TABLE IF NOT EXISTS cardlogs (
          id SERIAL PRIMARY KEY,
          date DATE NOT NULL,
          shift_no VARCHAR(20) NOT NULL,
          operator VARCHAR(100) NOT NULL,
          unit_no VARCHAR(20) NOT NULL,
          lampu_depan VARCHAR(50),
          lampu_belakang VARCHAR(50),
          ban_depan VARCHAR(50),
          ban_belakang VARCHAR(50),
          klakson VARCHAR(50),
          alarm_mundur VARCHAR(50),
          rem_jalan VARCHAR(50),
          rem_parkir VARCHAR(50),
          sabuk_pengaman VARCHAR(50),
          kebersihan VARCHAR(50),
          hm_awal DECIMAL(10,2),
          hm_akhir DECIMAL(10,2),
          odometer_awal DECIMAL(10,2),
          odometer_akhir DECIMAL(10,2),
          charging_durasi DECIMAL(10,2),
          charging_mulai VARCHAR(10),
          charging_selesai VARCHAR(10),
          odometer_photo TEXT,
          created_by INT REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS cardlog_activities (
          id SERIAL PRIMARY KEY,
          cardlog_id INTEGER REFERENCES cardlogs(id) ON DELETE CASCADE,
          jam_mulai VARCHAR(10),
          jam_selesai VARCHAR(10),
          deskripsi TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO permissions (id, name) VALUES 
      (1, 'cardlog_view'),
      (2, 'cardlog_add'),
      (3, 'cardlog_edit'),
      (4, 'cardlog_delete'),
      (5, 'cardlog_export'),
      (6, 'cardlog_edit_1h'),
      (7, 'user_management'),
      (8, 'cardlog_export_png'),
      (9, 'receive_email_notification'),
      (10, 'resend_email_notification')
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
    `);
    console.log('Database migrated successfully');
  } catch (err) {
    console.error('Migration error:', err);
  }
};

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Run migrations automatically
initDb();

module.exports = pool;
