const db = require('./db');
(async () => {
  const res = await db.query('SELECT * FROM permissions');
  console.log(res.rows);
  process.exit();
})();
