const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 處理 HTTP 流程（取訂單、呼叫 service、回覆 HTML/文字）
const { buildAioPayload, cashierUrl, verifyMac } = require('../payments/ecpayClient')
const { appendOrderDraft, updateByMerchantTradeNo } = require('../integrations/googleSheet')

// 方便印 log
function log(...args) {
  console.log('[payment]', ...args);
}
function warn(...args) {
  console.warn('[payment][warn]', ...args);
}
function err(...args) {
  console.error('[payment][error]', ...args);
}

// 根據 items 陣列扣減 Size.stock
async function decreaseStockByItems(items = [], merchantTradeNo = '') {
  if (!Array.isArray(items) || !items.length) {
    log('no items to decrease stock for', merchantTradeNo);
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const raw of items) {
      const id = raw?.id;
      const color = raw?.color;
      const sizeLabel = raw?.size;
      const qty = Number(raw?.qty || 0);

      if (!id || !color || !sizeLabel || !qty) {
        warn('skip invalid stock item', { merchantTradeNo, raw });
        continue;
      }

      // 找對應變體（商品 + 顏色）
      const variant = await tx.variant.findFirst({
        where: { productId: id, color },
        select: { id: true },
      });

      if (!variant) {
        warn('variant not found for stock update', { merchantTradeNo, productId: id, color, sizeLabel, qty });
        continue;
      }

      // 找對應 size 列
      const sizeRow = await tx.size.findFirst({
        where: { variantId: variant.id, label: sizeLabel },
        select: { id: true, stock: true },
      });

      if (!sizeRow) {
        warn('size not found for stock update', { merchantTradeNo, productId: id, color, sizeLabel, qty });
        continue;
      }

      if (sizeRow.stock < qty) {
        // 這裡先只記 log，不 throw，避免 notify 整體失敗
        warn('insufficient stock when decreasing', {
          merchantTradeNo,
          productId: id,
          color,
          sizeLabel,
          want: qty,
          stock: sizeRow.stock,
        });
      }

      await tx.size.update({
        where: { id: sizeRow.id },
        data: { stock: { decrement: qty } },
      });
    }
  });
}

async function buildItemsSummaryFromDb(items = []) {
  if (!Array.isArray(items) || !items.length) return ""

  const ids = [...new Set(items.map(i => i.id).filter(Boolean))]
  if (!ids.length) return JSON.stringify(items)

  let products = []
  try {
    products = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, title: true },
    })
  } catch (e) {
    warn("fetch products for items_json failed: ", e)
    // 查 DB 失敗時，保底：還是把原本 JSON 存進去，避免整單直接失敗
    return JSON.stringify(items)
  }

  const titleById = {}
  for (const p of products) {
    titleById[p.id] = p.title
  }

  const lines = items.map((i) => {
    const title = titleById[i.id] || i.id || '';
    const color = i.color ? ` / 顏色: ${i.color}` : '';
    const size = i.size ? ` / 尺寸: ${i.size}` : '';
    const qty = (i.qty != null) ? ` / 數量: ${i.qty}` : '';

    return `${title}${color}${size}${qty}`;
  })

  return lines.join('\n')
}

// 組合出貨摘要（給超商 / 宅配）
function buildShippingSummary(shipping = {}) {
  if (!shipping || !shipping.method) return '';
  if (shipping.method === 'pickup') {
    const { brand, county, district, name } = shipping;
    return [brand, county, district, name].filter(Boolean).join(' ');
  }
  return '宅配';
}

// 取得前端成功頁（可由環境變數覆寫）
function getSuccessPage() {
  return process.env.CHECKOUT_SUCCESS_URL || `${process.env.PUBLIC_BASE || ''}#checkout`;
}

// 建立交易：前端呼叫 → 後端先寫 Google Sheet「PENDING 草稿」→ 回傳自動 submit 表單
exports.createOrder = async (req, res) => {
  try {
    const { tradeNo, amount, itemName, email, order } = req.body || {};
    if (!tradeNo || !amount || !itemName) {
      return res.status(400).send('Missing required fields.');
    }

    // 1) 先寫入 Google Sheet 草稿（PENDING）

    const contact = order?.contact || {};
    const shipping = order?.shipping || {};

    const items = Array.isArray(order?.items) ? order.items : []

    const itemsSummary = await buildItemsSummaryFromDb(items)

    const stockItems = items.map(i => ({
      id: i.id,
      color: i.color,
      size: i.size,
      qty: i.qty,
    }))

    const stockJson = JSON.stringify(stockItems);
    const stockPayload = encodeURIComponent(stockJson)

    try {
      await prisma.stockSnapshot.upsert({
        where: { merchantTradeNo: tradeNo },
        update: {
          itemsJson: JSON.stringify(stockItems),
          processedAt: null, // 每次重新建立交易都視為尚未處理
        },
        create: {
          merchantTradeNo: tradeNo,
          itemsJson: JSON.stringify(stockItems),
        },
      });
      log('StockSnapshot upserted:', tradeNo);
    } catch (e) {
      err('StockSnapshot upsert failed:', tradeNo, e?.message || e);
    }

    try {
      await appendOrderDraft({
        merchant_trade_no: String(tradeNo),
        trade_no: '',
        buyer_name: contact.name || '',
        buyer_phone: contact.phone || '',
        buyer_email: contact.email || email || '',
        ship_method: shipping.method || '',
        ship_summary: buildShippingSummary(shipping),
        ship_address: shipping.address || '',
        items_json: itemsSummary,
        amount: String(amount || 0),
        status: 'PENDING',
        payment_method: '',
        payment_date: '',
        rtn_code: '',
        rtn_msg: '',
        note: contact.note || '',
      });
      log('Sheet draft appended:', tradeNo);
    } catch (e) {
      console.error('[sheet append draft failed]', e && e.stack ? e.stack : e);
    }

    // 2) 產生綠界交易參數與 CheckMacValue
    const payload = buildAioPayload({
      tradeNo,
      amount,
      itemName,
      email
    })

    console.log('[ECPAY payload URLs]', {
      ReturnURL: payload.ReturnURL,
      OrderResultURL: payload.OrderResultURL,
      ClientBackURL: payload.ClientBackURL,
    });

    // 3) 回傳「自動 submit 的表單 HTML」→ 前端同分頁寫入，導向收銀台
    res.type('html').send(`
      <html><body onload="document.forms[0].submit()">
        <form method="post" action="${cashierUrl}">
          ${Object.entries(payload)
        .map(
          ([k, v]) =>
            `<input type="hidden" name="${k}" value="${String(v).replace(/"/g, '&quot;')}">`,
        )
        .join('')}
          <noscript><button type="submit">前往綠界付款</button></noscript>
        </form>
      </body></html>
    `);
  } catch (e) {
    err('createOrder failed:', e?.message || e);
    res.status(500).send('Internal Server Error');
  }
};

// 綠界背景通知（ReturnURL）：驗簽 → 更新 Google Sheet 為 PAID/FAILED
exports.notify = async (req, res) => {
  const data = req.body || {};

  try {
    // 1) 驗簽
    const ok = verifyMac(data);
    if (!ok) {
      warn('CheckMacValue verify failed.', { MerchantTradeNo: data.MerchantTradeNo });
      return res.status(400).send('0|ERROR');
    }

    // 2) 交易結果
    const rtnCode = String(data.RtnCode || '');
    const merchantTradeNo = String(data.MerchantTradeNo || '');
    const tradeNo = String(data.TradeNo || '');
    const paymentDate = String(data.PaymentDate || '');
    const paymentType = String(data.PaymentType || '');
    const rtnMsg = String(data.RtnMsg || '');

    // 3) 成功或失敗 → 更新同一筆列
    if (rtnCode === '1') {
      try {
        await updateByMerchantTradeNo(merchantTradeNo, {
          status: 'PAID',
          trade_no: tradeNo,
          payment_method: paymentType,
          payment_date: paymentDate,
          rtn_code: rtnCode,
          rtn_msg: rtnMsg,
        });
        log('Sheet updated to PAID:', merchantTradeNo, tradeNo);
      } catch (e) {
        err('update PAID failed:', merchantTradeNo, e?.message || e);
        // 即便更新失敗，也回 1|OK，避免綠界重送太多次
      }

      try {
        const snap = await prisma.stockSnapshot.findUnique({
          where: { merchantTradeNo },
        });

        if (!snap) {
          warn('StockSnapshot not found, skip stock update', merchantTradeNo);
        } else if (snap.processedAt) {
          log('StockSnapshot already processed, skip stock update', merchantTradeNo);
        } else {
          let items;
          try {
            items = JSON.parse(snap.itemsJson);
          } catch (e) {
            err('StockSnapshot itemsJson parse failed', merchantTradeNo, e?.message || e);
            items = null;
          }

          if (Array.isArray(items) && items.length) {
            await decreaseStockByItems(items, merchantTradeNo);

            await prisma.stockSnapshot.update({
              where: { merchantTradeNo },
              data: { processedAt: new Date() },
            });

            log('stock decreased & StockSnapshot marked processed', merchantTradeNo);
          } else {
            warn('StockSnapshot items empty or invalid, skip stock update', merchantTradeNo);
          }
        }
      } catch (e) {
        err('stock update from StockSnapshot failed', merchantTradeNo, e?.message || e);
        // 這裡出錯一樣不要回 0|ERROR，以免綠界重送太多次
      }
    } else {
      try {
        await updateByMerchantTradeNo(merchantTradeNo, {
          status: 'FAILED',
          trade_no: tradeNo,
          payment_method: paymentType,
          payment_date: paymentDate,
          rtn_code: rtnCode,
          rtn_msg: rtnMsg,
        });
        log('Sheet updated to FAILED:', merchantTradeNo, tradeNo, rtnCode, rtnMsg);
      } catch (e) {
        err('update FAILED failed:', merchantTradeNo, e?.message || e);
      }
    }

    // 4) 綠界需要固定回應字串
    return res.send('1|OK');
  } catch (e) {
    err('notify handler error:', e?.message || e);
    return res.status(500).send('0|ERROR');
  }
};

// 使用者端導回（OrderResultURL）→ 後端接 POST → 轉址到前端成功頁
exports.resultForward = (req, res) => {
  try {
    const src = {
      ...(req.body || {}),
      ...(req.query || {}),
    }

    const {
      RtnCode,
      RtnMsg,
      MerchantTradeNo,
      TradeNo,
      TradeAmt,
      PaymentDate,
      PaymentType,
    } = src

    const success = String(RtnCode) === '1';
    const params = new URLSearchParams({
      s: success ? '1' : '0',
      msg: RtnMsg || '',
      orderNo: MerchantTradeNo || '',
      tradeNo: TradeNo || '',
      amt: TradeAmt || '',
      paidAt: PaymentDate || '',
      payType: PaymentType || '',
    }).toString();

    const successPage = getSuccessPage();
    return res.redirect(`${successPage}?mode=complete&${params}`);
  } catch (e) {
    err('resultForward failed:', e?.message || e);
    return res.redirect(`${getSuccessPage()}?mode=complete&s=0&msg=${encodeURIComponent('系統繁忙，請稍後查看訂單狀態')}`);
  }
};