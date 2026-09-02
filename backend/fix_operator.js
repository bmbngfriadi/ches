const db = require('./db');
async function run() {
  try {
    await db.query('DELETE FROM user_permissions WHERE user_id = 3');
    await db.query("INSERT INTO user_permissions (user_id, permission_id) VALUES (3, 1), (3, 2), (3, 6)");
    console.log('Operator permissions updated');
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
