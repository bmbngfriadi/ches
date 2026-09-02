require('dotenv').config();
const db = require('./db');

(async () => {
  try {
    const res = await db.query("UPDATE users SET role = 'administrator/dev' WHERE username = 'admin'");
    console.log(`Admin role updated successfully. Rows affected: ${res.rowCount}`);
    process.exit(0);
  } catch (err) {
    console.error("Error updating role:", err);
    process.exit(1);
  }
})();
