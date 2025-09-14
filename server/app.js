// --- top: env + deps ---
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// 允許的前端來源（GitHub Pages 網域）
const ALLOWLIST = (process.env.CORS_WHITELIST || 'https://timmyjun.github.io')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// 統一檢查 origin 是否允許
function isAllowed(origin) {
  return !origin || ALLOWLIST.includes(origin);
}

// （1）加 Vary: Origin，避免快取污染
app.use((req, res, next) => {
  res.setHeader('Vary', 'Origin');
  next();
});

// （2）先掛 cors 中介軟體（涵蓋一般情況）
const corsOptions = {
  origin(origin, cb) {
    if (isAllowed(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: false, // 你目前不帶 cookie
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

// （3）顯式處理所有預檢請求（避免少數情境 404）
app.options('*', cors(corsOptions));

// （4）保險：就算後面路由/錯誤沒經過 cors，也先補上最小必要標頭
app.use((req, res, next) => {
  const o = req.headers.origin;
  if (isAllowed(o)) {
    res.setHeader('Access-Control-Allow-Origin', o || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    // 若你未來需要帶 cookie，將 credentials 改為 'true'，並把上面的 corsOptions.credentials 也改為 true
    res.setHeader('Access-Control-Allow-Credentials', 'false');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// （5）再來才是 body parser 與你的路由
app.use(express.json());


app.get(['/api/health', '/health'], (_req, res) => res.json({ ok: true }));
const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);
module.exports = app