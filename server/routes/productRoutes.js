const router = require('express').Router();
const ctrl = require('../controllers/productController');


// 產品列表（支援 year+type 篩選）
router.get('/', ctrl.list);

//API檢查
router.get('/ping', (req, res) => res.json({ ok: true })); // 健康檢查

// 年+季清單（用來產出 25SS/24FW 的選單）
router.get('/collections/season-tags', ctrl.seasonTags);

// 產品詳情
router.get('/:id', ctrl.getOne);

// 臨時偵錯：列出這個 router 內所有註冊路徑
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

module.exports = router
