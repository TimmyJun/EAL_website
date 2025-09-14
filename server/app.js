require('dotenv').config();
const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/productRoutes');

const app = express();

// --- CORS（你原本那套保持；以下是一個穩定範例） ---
const ALLOWLIST = (process.env.CORS_WHITELIST || 'https://timmyjun.github.io')
  .split(',').map(s => s.trim()).filter(Boolean);
const isAllowed = (o) => !o || ALLOWLIST.includes(o);

app.use((req, res, next) => { res.setHeader('Vary', 'Origin'); next(); });

const corsOptions = {
  origin(origin, cb) { return isAllowed(origin) ? cb(null, true) : cb(new Error('Not allowed by CORS')); },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
// ----------------------------------------------------

app.use(express.json());

// 健康檢查
app.get(['/api/health', '/health'], (_req, res) => res.json({ ok: true }));

// ✅ 全域偵錯：看 Express 實際收到什麼 URL
app.get('/api/__whoami', (req, res) => {
  res.json({ method: req.method, url: req.url, originalUrl: req.originalUrl });
});

// ✅ 掛上產品路由（一定要在任何 404 / 錯誤處理器之前）
app.use('/api/products', productRoutes);

// （可選）最後的 404
app.use((req, res) => res.status(404).json({ ok: false, path: req.originalUrl }));

// （可選）錯誤處理器
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ ok: false, message: err.message });
});

module.exports = app;
