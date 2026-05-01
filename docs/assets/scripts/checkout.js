const nt = new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 });
const SHIPPING_FEE = { pickup: 60, home: 100 }
const q = (s) => document.querySelector(s);
const qa = (s) => Array.from(document.querySelectorAll(s));

function getShipMethod() {
  return q('input[name="shipMethod"]:checked')?.value || 'pickup';
}
function showError(id, show) {
  const el = q(`.error[data-err="${id}"]`);
  if (el) el.classList.toggle('show', !!show);
}

function getHashParams() {
  const raw = location.hash || '';  // 例如 "#checkout?mode=complete&s=1&orderNo=O123"
  const q = raw.includes('?') ? raw.split('?')[1] : '';
  return new URLSearchParams(q);
}

// ---------- UI 切換 & 金額 ----------
function renderTotals(subtotal) {
  const method = getShipMethod();
  const ship = SHIPPING_FEE[method] ?? 0;
  const grand = (Number(subtotal) || 0) + ship;
  q('#shipping') && (q('#shipping').textContent = nt.format(ship));
  q('#subtotal') && (q('#subtotal').textContent = nt.format(subtotal || 0));
  q('#grand') && (q('#grand').textContent = nt.format(grand));
  return { ship, grand };
}

function updateShippingUI() {
  const method = getShipMethod();
  const pickup = q('#pickupFields');
  const home = q('#homeFields');
  const hint = q('#shipHint');
  if (pickup && home) {
    if (method === 'pickup') {
      pickup.style.display = '';
      home.style.display = 'none';
      if (hint) hint.textContent = '目前僅支援台灣超商到店';
    } else {
      pickup.style.display = 'none';
      home.style.display = '';
      if (hint) hint.textContent = '請填寫完整宅配地址';
    }
  }
  // 依目前小計重算運費（如果 subtotal 尚未算過就不動）
  const subEl = q('#subtotal');
  if (subEl && subEl.textContent) {
    const subNum = Number(subEl.textContent.replace(/[^\d]/g, '')) || 0;
    renderTotals(subNum);
  }
}

// 綁整組 radio（未來多選項也不用再改）
function bindShippingEvents() {
  qa('input[name="shipMethod"]').forEach(el => {
    el.addEventListener('change', updateShippingUI);
    el.addEventListener('click', updateShippingUI);
  });
}

// ---------- 購物清單 ----------
function fallbackCartEntries() {
  try {
    const raw = localStorage.getItem('cart'); // 依你的實際 key 調整
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function clearCartAfterPayment() {
  // 1) 清前端 cartStore + localStorage(app:cart:v1)
  try {
    window.clearCart?.();        // 這會呼叫 cartStore.clear()
  } catch (e) {
    console.warn('[checkout] clearCart failed:', e);
  }

  // 2) 順便把這次結帳暫存的 payload 清掉，避免下次誤用
  try {
    sessionStorage.removeItem('checkoutPayload');
  } catch (e) {
    console.warn('[checkout] remove checkoutPayload failed:', e);
  }
}

async function loadCartAndRender() {
  const itemsWrap = q('#items');
  const empty = q('#empty');
  if (!itemsWrap) return { entries: [], subtotal: 0, grand: 0 };

  itemsWrap.innerHTML = '';

  let entries = (window.cartStore?.entries?.() || []).slice();
  if (!entries.length) entries = fallbackCartEntries();

  if (!entries.length) {
    if (empty) empty.style.display = 'block';
    renderTotals(0);
    return { entries: [], subtotal: 0, grand: 0 };
  }
  if (empty) empty.style.display = 'none';

  const metaMap = await window.productService?.fetchByIds?.(entries.map(e => e.id)) || {};
  let subtotal = 0;

  entries.forEach(e => {
    const meta = metaMap[e.id] || { title: e.id, price: 0, image: 'assets/images/placeholder.png', images: {} };
    const unit = Number(meta.price) || 0;
    const line = unit * Number(e.qty || 0);
    subtotal += line;

    const thumb = meta.images?.[e.color] || meta.image;

    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <div class="thumb"><img src="${thumb}" alt="" /></div>
      <div class="meta">
        <div>${meta.title}</div>
        <div class="muted">顏色：${e.color}　尺寸：${e.size}　數量：${e.qty}</div>
      </div>
      <div class="price">${nt.format(line)}</div>
    `;
    itemsWrap.appendChild(div);
  });

  const { grand } = renderTotals(subtotal);
  return { entries, subtotal, grand };
}

// ---------- 權威驗庫存 ----------
async function checkStock(entries) {
  if (window.productService?.checkStock) return window.productService.checkStock(entries);
  return { ok: true };
}

// ---------- 驗證 & Payload ----------
function validateForm() {
  const baseNeed = ['name', 'phone', 'email', "instagram"]
  const method = getShipMethod()
  const need = method === 'pickup'
    ? [...baseNeed, 'storeBrand', 'county', 'district', 'storeName', 'storeAddr']
    : [...baseNeed, 'homeAddress']

  let ok = true;
  need.forEach(id => {
    const input = q('#' + id);
    let valid = !!input?.value?.trim();
    if (id === 'phone' && valid) valid = /^09\d{8}$/.test(input.value.trim());
    if (id === 'email' && valid) valid = input.checkValidity()
    if (id === 'instagram' && valid) valid = input.value.trim().length <= 30
    showError(id, !valid);
    if (!valid) ok = false;
  });

  const extra = method === 'pickup'
    ? ['homeAddress']
    : ['storeBrand', 'county', 'district', 'storeName', 'storeAddr'];
  extra.forEach(id => showError(id, false));

  return ok;
}

function buildAndStorePayload(entries, grand) {
  const f = q('#checkoutForm');
  const fd = Object.fromEntries(new FormData(f).entries());
  const method = getShipMethod();

  const payload = {
    contact: {
      name: fd.name, phone: fd.phone, email: fd.email,
      instagram: (fd.instagram || '').trim(),
      note: fd.note || ''
    },
    shipping: {
      method,
      ...(method === 'pickup'
        ? { brand: fd.storeBrand, county: fd.county, district: fd.district, name: fd.storeName, address: fd.storeAddr }
        : { address: fd.homeAddress })
    },
    items: entries,
    amount: grand
  };
  sessionStorage.setItem('checkoutPayload', JSON.stringify(payload));
  return payload;
}

async function postAndRedirectToEcpay({ grand, email, entries }) {
  // 產生一個前端測試用單號（正式上線可改由後端產生）
  const tradeNo = 'O' + Date.now();
  const API_BASE = (window.CONFIG && window.CONFIG.API_BASE) || 'http://localhost:3000'

  // 品名可簡化成「共 N 項商品」，或你要用實際品名以 # 串接也行
  const itemName = `共 ${Array.isArray(entries) ? entries.length : 0} 項商品`;

  // 取出你在送單前已存到 sessionStorage 的完整表單 + 購物車資訊
  let order = {}
  try {
    order = JSON.parse(sessionStorage.getItem("checkoutPayload") || "{}")
  }catch (_) {
    order = {}
  }

  // 以防萬一，若 order.items 為空，回填這次傳入的 entries
  if(!Array.isArray(order.items) || !order.items.length) {
    order.items = Array.isArray(entries) ? entries: []
  }

  // 同步總金額
  order.amount = grand

  // 呼叫後端建立交易（後端會回一段自動 submit 的 <form> HTML）
  const resp = await fetch(`${API_BASE}/api/pay/ecpay/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tradeNo,
      amount: grand,
      itemName,
      email,
      order
    })
  });

  if (!resp.ok) {
    const t = await resp.text().catch(() => '');
    throw new Error(`create order failed: ${resp.status} ${t}`);
  }

  // 伺服器回的是一段含 <form action=".../AioCheckOut/V5"> 的 HTML
  const html = await resp.text();

  // 用同一個分頁寫入，避免被彈出視窗阻擋器擋住
  const w = window.open('', '_self');
  w.document.open();
  w.document.write(html);
  w.document.close();
}

// ---------- Submit ----------
async function onSubmitCheckout(e) {
  e.preventDefault();
  const payBtn = q('#payBtn');
  try {
    if (!validateForm()) return;
    payBtn.disabled = true; payBtn.textContent = '處理中…';

    const { entries, grand } = await loadCartAndRender();
    if (!entries?.length) { alert('購物車是空的'); return; }

    const resp = await checkStock(entries.map(e => ({ id: e.id, color: e.color, size: e.size, qty: e.qty })));
    if (!resp.ok) {
      const msg = (resp.issues || [])
        .map(i => `「${i.title || i.id}」${i.color}/${i.size} 欲購 ${i.want}，可用 ${i.available}`)
        .join('\n') || '部分商品庫存不足';
      alert(msg); return;
    }

    const payload = buildAndStorePayload(entries, grand)
    await postAndRedirectToEcpay({
      grand,
      email: payload.contact.email,
      entries
    })
  } catch (err) {
    console.error('[checkout submit error]', err);
    alert('處理失敗，請稍後再試');
  } finally {
    payBtn.disabled = false; payBtn.textContent = '前往付款';
  }
}

function renderCheckoutComplete(params) {
  const ok = params.get('s') === '1';
  const orderNo = params.get('orderNo') || '-';
  const tradeNo = params.get('tradeNo') || '-';
  const amt = params.get('amt') || '-';
  const msg = params.get('msg') || (ok ? '付款成功' : '付款未完成');

  if (ok) {
    clearCartAfterPayment();
  }

  // 找一個 checkout 頁的主要容器來替換（依你 checkout.html 的結構挑選）
  const host = document.querySelector('#checkoutView') || document.querySelector('main') || document.body;

  host.innerHTML = `
    <section class="checkout-complete" style="padding:2rem 1rem; margin: 10em 0; display: flex; flex-direction: column; align-items: center;">
      <h1 style="margin-bottom:1rem">${ok ? '付款成功 🎉' : '付款未完成'}</h1>
      <p>${msg}</p>
      <ul style="margin:1rem 0 2rem; line-height:1.8;">
        <li>訂單編號：${orderNo}</li>
        <li>交易序號：${tradeNo}</li>
        <li>金額：${amt}</li>
      </ul>
      <div style="display:flex; gap: 2rem;">
        <a class="btn" href="#home" style="text-decoration: none;">回首頁</a>
        <a class="btn" href="#checkout" style="text-decoration: none;">回結帳</a>
      </div>
    </section>
  `;
}

// ---------- Router 入口（給 main.js 呼叫） ----------
window.initCheckoutPage = async function initCheckoutPage() {
  const params = getHashParams()
  if (params.get('mode') === 'complete') {
    renderCheckoutComplete(params);     // ← 新增：渲染完成頁
    return;                             // 完成頁不需要後續表單綁定
  }

  bindShippingEvents();
  updateShippingUI();
  await loadCartAndRender();
  q('#checkoutForm')?.addEventListener('submit', onSubmitCheckout);
}

function isCheckoutPage() {
  // 以是否存在 #checkoutForm 為判斷，避免受網址或 hash 影響
  return !!document.getElementById('checkoutForm');
}

window.refreshCheckoutSidebar = async function refreshCheckoutSidebar() {
  // 只要右側卡片需更新，沿用既有 loadCartAndRender 即可
  await loadCartAndRender();
}

window.addEventListener('cart:closed', () => {
  if (isCheckoutPage()) {
    // 關閉側欄後自動刷新右側清單（items、小計、運費、總額）
    loadCartAndRender();
  }
})