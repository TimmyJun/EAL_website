require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
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
app.use(compression());

// 健康檢查
app.get(['/api/health', '/health'], (_req, res) => res.json({ ok: true }));

// （清理）移除診斷端點 __whoami

// ✅ 掛上產品路由（一定要在任何 404 / 錯誤處理器之前）
app.use('/api/products', productRoutes);

// 若未命中 productRoutes 的任何路由，提供更清楚的 404 訊息
app.use('/api/products', (req, res, _next) => {
  res.status(404).json({ ok: false, where: 'products-fallback', url: req.url, baseUrl: req.baseUrl, originalUrl: req.originalUrl });
});

// （可選）最後的 404
app.use((req, res) => res.status(404).json({ ok: false, path: req.originalUrl }));

// （可選）錯誤處理器
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ ok: false, message: err.message });
});

module.exports = app;
