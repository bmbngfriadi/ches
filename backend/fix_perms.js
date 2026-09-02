const db = require('./db');
async function run() {
  try {
    await db.query('DELETE FROM permissions WHERE id >= 6');
    await db.query("INSERT INTO permissions (id, name) VALUES (6, 'cardlog_edit_1h'), (7, 'user_management')");
    console.log('Fixed');
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
