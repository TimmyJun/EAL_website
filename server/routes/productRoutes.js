// server/routes/productRoutes.js
const router = require('express').Router();
const ctrl = require('../controllers/productController');

// 偵錯：確認這個 router 有被掛到
router.get('/ping', (_req, res) => res.json({ ok: true }));

// 列表
router.get('/', ctrl.list);

// ✅ 目標路由（放在 :id 之前；並加一個可選結尾斜線）
router.get(['/collections/season-tags', '/collections/season-tags/'], ctrl.seasonTags);

// 單筆
router.get('/:id', ctrl.getOne);

// 偵錯：列出這個 router 內的所有已註冊路徑
router.get('/__routes', (_req, res) => {
  const paths = [];
  for (const layer of router.stack) {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase()).join(',');
      paths.push({ methods, path: layer.route.path });
    }
  }
  res.json(paths);
});

module.exports = router;
