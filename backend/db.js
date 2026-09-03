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
          user_id INTEGER REFERENCES users(id),
          description TEXT NOT NULL,
          image_url VARCHAR(255),
          status VARCHAR(50) DEFAULT 'open',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS cardlog_activities (
          id SERIAL PRIMARY KEY,
          cardlog_id INTEGER REFERENCES cardlogs(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id),
          action VARCHAR(50) NOT NULL,
          note TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO permissions (id, name) VALUES 
      (1, 'cardlog_view'),
      (2, 'cardlog_add'),
      (3, 'cardlog_edit_1h'),
      (4, 'cardlog_delete_1h'),
      (5, 'cardlog_export_png'),
      (6, 'user_management'),
      (7, 'cardlog_resolve'),
      (8, 'cardlog_edit_any'),
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
