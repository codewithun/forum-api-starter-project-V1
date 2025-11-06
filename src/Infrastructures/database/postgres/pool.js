/* istanbul ignore file */
const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
const isTest = process.env.NODE_ENV === 'test';

// --- pilih konfigurasi dasar sesuai environment ---
const baseConfig = isTest
  ? {
      // Default to IPv4 localhost to avoid macOS resolving 'localhost' to ::1
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

// --- tambahkan SSL hanya kalau bukan localhost ---
const useSSL =
  isProduction ||
  process.env.PGSSL === 'require' ||
  (baseConfig.host && !baseConfig.host.includes('localhost') && !baseConfig.host.includes('127.0.0.1'));

const pool = new Pool({
  ...baseConfig,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

module.exports = pool;
