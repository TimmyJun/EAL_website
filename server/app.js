require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

/** 允許的前端來源（GitHub Pages 網域即可） */
const ALLOWLIST = (process.env.CORS_WHITELIST || 'https://timmyjun.github.io')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const isAllowed = (origin) => !origin || ALLOWLIST.includes(origin);

/** 保證 Cache 正確區分不同 Origin */
app.use((req, res, next) => {
  res.setHeader('Vary', 'Origin');
  next();
});

/** 標準 cors()（涵蓋大部分情況） */
const corsOptions = {
  origin(origin, cb) {
    if (isAllowed(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: false, // 目前不傳 cookie，先用 false 最單純
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

/** ✅ Express 5 相容的預檢處理：改掉 '*'，用正規表達式捕捉全部路徑 */
app.options(/.*/, cors(corsOptions));

/** 保險層：就算後面 404/500，也補上必要的 CORS 標頭 */
app.use((req, res, next) => {
  const o = req.headers.origin;
  if (isAllowed(o)) {
    res.setHeader('Access-Control-Allow-Origin', o || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'false');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

/** 再來才是 body parser 與你的路由 */
app.use(express.json());

/** 你的路由掛載（示例） */
app.get(['/api/health', '/health'], (_req, res) => res.json({ ok: true }));

const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

/** Vercel：不要 app.listen()，改匯出 app */
module.exports = app