require('dotenv').config();
const express = require('express');
const cors = require('cors');
// compression 可能在舊部署尚未安裝，容錯處理避免 500
let compression = null;
try { compression = require('compression'); }
catch (_e) { compression = () => (req, res, next) => next(); }
const productRoutes = require('./routes/productRoutes')
const paymentRoutes = require('./routes/paymentRoutes')

const app = express();

// --- CORS（開放；避免白名單不符導致 500 與缺少 CORS 標頭） ---
app.use((req, res, next) => { res.setHeader('Vary', 'Origin'); next(); });
app.use(cors({ origin: true, credentials: false }));
// Express 5 不接受萬用字元字串，改用正則
app.options(/.*/, cors({ origin: true, credentials: false }));
// -------------------------------------------------------

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// 健康檢查
app.get(['/api/health', '/health'], (_req, res) => res.json({ ok: true }));

// 將壓縮延後到健康檢查之後（排除壓縮導致的 500）
app.use(compression());

// ✅ 掛上產品路由（一定要在任何 404 / 錯誤處理器之前）
app.use('/api/products', productRoutes);

// 若未命中 productRoutes 的任何路由，提供更清楚的 404 訊息
app.use('/api/products', (req, res, _next) => {
  res.status(404).json({ ok: false, where: 'products-fallback', url: req.url, baseUrl: req.baseUrl, originalUrl: req.originalUrl });
});

app.use('/api/pay', paymentRoutes)

// （可選）最後的 404
app.use((req, res) => res.status(404).json({ ok: false, path: req.originalUrl }));

// （可選）錯誤處理器
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ ok: false, message: err.message });
});

module.exports = app;
