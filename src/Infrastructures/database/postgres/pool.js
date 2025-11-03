/* istanbul ignore file */
const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
const isTest = process.env.NODE_ENV === 'test';

// --- pilih konfigurasi dasar sesuai environment ---
const baseConfig = isTest
  ? {
      host: process.env.PGHOST_TEST,
      port: process.env.PGPORT_TEST,
      user: process.env.PGUSER_TEST,
      password: process.env.PGPASSWORD_TEST,
      database: process.env.PGDATABASE_TEST,
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
