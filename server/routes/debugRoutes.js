// server/routes/debugRoutes.js
const router = require('express').Router();
const { appendOrderDraft, updateByMerchantTradeNo } = require('../integrations/googleSheet');
const os = require('os');

// 單純測試：新增一列 PENDING 草稿
router.post('/api/debug/sheet/append', async (_req, res) => {
  try {
    await appendOrderDraft({
      merchant_trade_no: 'TEST_' + Date.now(),
      buyer_name: '測試用戶',
      buyer_phone: '0912345678',
      buyer_email: 'test@example.com',
      ship_method: 'pickup',
      ship_summary: '7-11 台北市 中正區 和平店',
      ship_address: '台北市中正區和平東路一段 1 號',
      items_json: JSON.stringify([{ sku: 'P1', name: '測試商品', qty: 1, price: 100 }]),
      amount: '100',
      status: 'PENDING',
      note: 'debug append',
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// 依訂單編號更新該列（把狀態改成 PAID）
router.post('/api/debug/sheet/update', async (req, res) => {
  try {
    const { no } = req.body || {};
    const ok = await updateByMerchantTradeNo(String(no || ''), { status: 'PAID', rtn_msg: 'debug paid' });
    res.json({ ok });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

router.get('/api/debug/whoami', (req, res) => {
  res.json({
    pid: process.pid,
    cwd: process.cwd(),
    node: process.version,
    env: {
      sheetId: !!process.env.GOOGLE_SHEET_ID,
      email: process.env.GOOGLE_SA_CLIENT_EMAIL || null,
      keyLen: (process.env.GOOGLE_SA_PRIVATE_KEY || '').length || null,
      hasKeyB64: !!process.env.GOOGLE_SA_PRIVATE_KEY_B64,
      hasCredJsonB64: !!process.env.GOOGLE_SA_CREDENTIALS_JSON_B64,
    },
    host: os.hostname(),
  });
});

module.exports = router;
