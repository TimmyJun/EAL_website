const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.warn('[DB] DATABASE_URL not set. DB routes will fail until you set it.');
}

// 偵測是否在 serverless（Vercel / staging）
const isServerless = process.env.VERCEL === '1' || process.env.APP_ENV === 'staging';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Serverless + Neon：小連線池較穩
  max: isServerless ? 2 : undefined,
  idleTimeoutMillis: isServerless ? 10_000 : undefined,
  // 多數雲端 PG 需要 SSL，Neon 連線字串也會帶 sslmode=require
  ssl: { rejectUnauthorized: false }
});

module.exports = { pool };