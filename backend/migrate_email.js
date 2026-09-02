const db = require('./db');

async function migrate() {
  try {
    await db.query('BEGIN');
    
    // Add columns to users if they don't exist
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;`);
    
    // Insert new permission
    // Assuming ID 9 for email notification to avoid conflict with existing (1-8)
    await db.query(`
      INSERT INTO permissions (id, name) 
      VALUES (9, 'receive_email_notification') 
      ON CONFLICT DO NOTHING
    `);
    
    await db.query('COMMIT');
    console.log('Migration successful');
  } catch(e) {
    await db.query('ROLLBACK');
    console.error('Migration failed:', e);
  } finally {
    process.exit(0);
  }
}

migrate();
