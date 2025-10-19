// 處理 HTTP 流程（取訂單、呼叫 service、回覆 HTML/文字）
const { buildAioPayload, cashierUrl, verifyMac } = require('../payments/ecpayClient')

exports.createOrder = async (req, res) => {
  // 從前端/資料庫取得訂單資訊
  const { tradeNo, amount, itemName, email } = req.body

  // 產生送綠界的參數與 CheckMacValue
  const payload = buildAioPayload({
    tradeNo,
    amount,
    itemName,
    email,
    returnUrl: 'https://your.api.com/api/pay/ecpay/notify',
    orderResultUrl: 'https://your.site.com/checkout/complete',
    clientBackUrl: 'https://your.site.com/checkout',
  })

  // 回傳一段會自動 submit 的表單
  res.type('html').send(`
    <html><body onload="document.forms[0].submit()">
      <form method="post" action="${cashierUrl}">
        ${Object.entries(payload).map(([k, v]) => `<input type="hidden" name="${k}" value="${v}">`).join('')}
        <noscript><button type="submit">前往綠界付款</button></noscript>
      </form>
    </body></html>
  `)
}

exports.notify = async (req, res) => {
  // 需搭配 app.use(express.urlencoded({ extended: false })) 或路由層加解析
  const data = req.body

  // 驗簽
  const ok = verifyMac(data)
  if(!ok) {
    return res.status(400).send("0|ERROR")
  }

  // 成功（RtnCode=1）→ 更新訂單狀態
  if(String(data.RtnCode) === "1") {
    // e.g., await Order.markPaid(data.MerchantTradeNo, data.TradeNo, data.PaymentDate)
  }

  res.send('1|OK')
}

// 使用者端導回（OrderResultURL）→ 後端接 POST → 轉址到前端成功頁
exports.resultForward = (req, res) => {
  // 綠界會 POST 一些欄位（如 RtnCode, MerchantTradeNo, TradeNo, TradeAmt...）
  const {
    RtnCode, RtnMsg, MerchantTradeNo, TradeNo, TradeAmt, PaymentDate, PaymentType
  } = req.body || {};

  // 這裡不做權責動作（以 ReturnURL 的背景通知為準），單純把「可看資訊」帶到前端成功頁
  const success = String(RtnCode) === '1';
  const params = new URLSearchParams({
    s: success ? '1' : '0',
    msg: RtnMsg || '',
    orderNo: MerchantTradeNo || '',
    tradeNo: TradeNo || '',
    amt: TradeAmt || '',
    paidAt: PaymentDate || '',
    payType: PaymentType || ''
  }).toString();

  // 你的前端成功頁（可用環境變數配置）
  const successPage = process.env.CHECKOUT_SUCCESS_URL
    || `${process.env.PUBLIC_BASE || ''}#checkout`;

  return res.redirect(`${successPage}?mode=complete&${params}`);
};