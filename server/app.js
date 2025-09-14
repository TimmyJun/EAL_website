require('dotenv').config();
const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/productRoutes');
const { pool } = require('./db')
const app = express();

const fromEnv = (process.env.CORS_WHITELIST || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const whitelist = [
  'https://timmyjun.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:5500',
  ...fromEnv
]

const corsOptions = {
  origin(origin, cb) {
    // 無 Origin（如 Postman/curl）就放行
    if (!origin || whitelist.includes(origin)) return cb(null, true);

    // 偵錯：印出被擋的來源，方便你加進白名單
    console.warn('[CORS blocked] origin =', origin);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: false,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use(express.json());

app.use('/api/products', productRoutes);

app.get(['/api/health', '/health'], (_req, res) => res.json({ ok: true }));

app.get('/', (req, res) => {
  res.send('✅ Express server is running');
});

// DB 健康檢查（部署前先本地驗收這個）
app.get(['/api/dbping', '/dbping'], async (_req, res) => {
  try {
    const { rows } = await pool.query('select 1 as ok');
    return res.json({ db: rows[0].ok === 1 });
  } catch (e) {
    console.error('[dbping] error', e);
    return res.status(500).json({ db: false, error: e.message });
  }
});

app.use((err, req, res, _next) => {
  console.error('[EXPRESS ERROR]', err);
  res.status(500).json({ ok: false, message: err.message });
});

module.exports = app;
