// 只定義網址與 HTTP 方法
const router = require('express').Router()
const ctrl = require('../controllers/paymentController')

// 建立訂單 → 送綠界（回傳自動送出的 form HTML）
router.post('/ecpay/create', ctrl.createOrder)

// 綠界背景通知（ReturnURL）x-www-form-urlencoded
router.post('/ecpay/notify', ctrl.notify)

router.post('/ecpay/result', ctrl.resultForward)

module.exports = router