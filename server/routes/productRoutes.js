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

module.exports = router
