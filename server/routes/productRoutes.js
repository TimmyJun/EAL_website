const router = require('express').Router();
const ctrl = require('../controllers/productController');

// 只保留 GET /api/products
router.get('/', ctrl.list);
router.get('/ping', (req, res) => res.json({ ok: true })); // 健康檢查
router.get('/:id', ctrl.getOne);

module.exports = router
