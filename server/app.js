require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const productRoutes = require('./routes/productRoutes');

const app = express();

// --- CORS（開放；避免白名單不符導致 500 與缺少 CORS 標頭） ---
app.use((req, res, next) => { res.setHeader('Vary', 'Origin'); next(); });
app.use(cors({ origin: true, credentials: false }));
app.options('*', cors({ origin: true, credentials: false }));
// -------------------------------------------------------

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
