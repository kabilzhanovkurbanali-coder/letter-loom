const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER || 'kurbanali',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'kurbanali_db',
  password: process.env.PGPASSWORD || '0000',
  port: Number(process.env.PGPORT) || 5432,
});

pool.on('error', (err, client) => {
  console.error('⚠️ Обрыв соединения с БД:', err.message);
});

module.exports = pool;
