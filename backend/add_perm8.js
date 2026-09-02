const db = require('./db');
async function run() {
  try {
    await db.query("INSERT INTO permissions (id, name) VALUES (8, 'cardlog_export_png') ON CONFLICT DO NOTHING");
    console.log('Permission added');
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
