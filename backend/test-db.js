const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'your_password',
  database: process.env.DB_NAME || 'ches_db',
  port: process.env.DB_PORT || 5432,
});

async function test() {
  try {
    const client = await pool.connect();
    console.log("Connected successfully!");
    
    const res = await client.query("SELECT to_regclass('public.users') as table_exists;");
    if (res.rows[0].table_exists) {
        console.log("Table 'users' exists.");
    } else {
        console.log("Table 'users' does NOT exist!");
    }
    client.release();
    process.exit(0);
  } catch (err) {
    console.error("Connection error:", err.message);
    process.exit(1);
  }
}

test();
