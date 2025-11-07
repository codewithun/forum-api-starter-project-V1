/* istanbul ignore file */
const { Pool } = require('pg');

const isTest = process.env.NODE_ENV === 'test';

// --- pilih konfigurasi dasar sesuai environment ---
const baseConfig = isTest
  ? {
      host: process.env.PGHOST_TEST || '127.0.0.1',
      port: process.env.PGPORT_TEST || 5432,
      user: process.env.PGUSER_TEST || 'developer',
      password: process.env.PGPASSWORD_TEST || 'supersecretpassword',
      database: process.env.PGDATABASE_TEST || 'forumapi_test',
    }
  : {
      host: process.env.PGHOST,
      port: process.env.PGPORT,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
    };

// --- tentukan apakah perlu SSL ---
const host = baseConfig.host || '';
const requireSSL = !isTest && (
  process.env.PGSSLMODE === 'require' ||
  (!host.includes('localhost') && !host.includes('127.0.0.1'))
);

// --- inisialisasi Pool ---
const pool = new Pool({
  ...baseConfig,
  ssl: requireSSL ? { rejectUnauthorized: false } : false,
});

module.exports = pool;
