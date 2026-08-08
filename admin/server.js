// admin/server.js
// EAL 本機商品管理後台（路線 A：只在本機跑，連遠端 DB / S3）。
// 預設連 staging，避免測試期間誤動正式資料。
//   npm run admin        -> 連 .env.staging
//   npm run admin:prod   -> 連 .env.prod（會顯示紅色警告）
const path = require('path');
const fs = require('fs');

// 1) 決定要載入哪個環境檔
const ADMIN_ENV = (process.env.ADMIN_ENV || 'staging').toLowerCase();
const ENV_FILE = ADMIN_ENV === 'prod' ? '.env.prod'
  : ADMIN_ENV === 'local' ? '.env'
  : '.env.staging';

const envPath = path.resolve(__dirname, '..', ENV_FILE);
if (!fs.existsSync(envPath)) {
  console.error(`\n[admin] 找不到環境檔：${ENV_FILE}（預期路徑：${envPath}）`);
  process.exit(1);
}
require('dotenv').config({ path: envPath });
process.env.ADMIN_ENV = ADMIN_ENV;

const express = require('express');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = Number(process.env.ADMIN_PORT || 4300);

// base64 圖片會讓 body 變大，放寬上限（本機使用，安全無虞）
app.use(express.json({ limit: '80mb' }));
app.use(express.urlencoded({ extended: false, limit: '80mb' }));

// API
app.use('/admin/api', adminRoutes);

// 靜態後台頁面
app.use('/', express.static(path.join(__dirname, 'web')));

// 啟動橫幅：清楚顯示目前連到哪個環境
function maskDbHost(url) {
  try { return new URL(url).host; } catch { return '(無法解析)'; }
}
app.listen(PORT, () => {
  const isProd = ADMIN_ENV === 'prod';
  const line = '='.repeat(52);
  console.log('\n' + line);
  console.log(`  EAL 管理後台已啟動`);
  console.log(`  環境 ADMIN_ENV : ${ADMIN_ENV}${isProd ? '  ⚠️  正式環境！操作會影響線上資料' : ''}`);
  console.log(`  環境檔          : ${ENV_FILE}`);
  console.log(`  資料庫 host     : ${maskDbHost(process.env.DATABASE_URL)}`);
  console.log(`  S3 bucket       : ${process.env.AWS_S3_BUCKET || '(未設定)'}`);
  console.log(`  開啟後台        : http://localhost:${PORT}`);
  console.log(line + '\n');
});
