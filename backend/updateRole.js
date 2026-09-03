require('dotenv').config();
const db = require('./db');

(async () => {
  try {
    const username = process.argv[2];
    if (!username) {
      console.error("Error: Masukkan username Anda! (Contoh: node updateRole.js bambang)");
      process.exit(1);
    }
    const res = await db.query("UPDATE users SET role = 'administrator/dev' WHERE username = $1", [username]);
    if (res.rowCount === 0) {
      console.log(`Username '${username}' tidak ditemukan di database!`);
    } else {
      console.log(`SUKSES! Akun '${username}' sekarang sudah menjadi Administrator/Dev.`);
    }
    process.exit(0);
  } catch (err) {
    console.error("Error updating role:", err);
    process.exit(1);
  }
})();
