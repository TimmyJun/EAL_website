const nt = new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 });
const SHIPPING_FEE = { pickup: 0, home: 80 };
const q = (s) => document.querySelector(s);
const qa = (s) => Array.from(document.querySelectorAll(s));

function getShipMethod() {
  return q('input[name="shipMethod"]:checked')?.value || 'pickup';
}
function showError(id, show) {
  const el = q(`.error[data-err="${id}"]`);
  if (el) el.classList.toggle('show', !!show);
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

function bindBack() {
  q('#backBtn')?.addEventListener('click', () => window.history.back());
}

// ---------- 購物清單 ----------
function fallbackCartEntries() {
  try {
    const raw = localStorage.getItem('cart'); // 依你的實際 key 調整
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
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
  const baseNeed = ['name', 'phone', 'email'];
  const method = getShipMethod();
  const need = method === 'pickup'
    ? [...baseNeed, 'storeBrand', 'county', 'district', 'storeName', 'storeAddr']
    : [...baseNeed, 'homeAddress'];

  let ok = true;
  need.forEach(id => {
    const input = q('#' + id);
    let valid = !!input?.value?.trim();
    if (id === 'phone' && valid) valid = /^09\d{8}$/.test(input.value.trim());
    if (id === 'email' && valid) valid = input.checkValidity();
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
      name: fd.name, phone: fd.phone, email: fd.email, note: fd.note || ''
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

    buildAndStorePayload(entries, grand);
    alert('表單已通過並保存。下一步可串接綠界建立訂單。');
  } catch (err) {
    console.error('[checkout submit error]', err);
    alert('處理失敗，請稍後再試');
  } finally {
    payBtn.disabled = false; payBtn.textContent = '前往付款';
  }
}

// ---------- Router 入口（給 main.js 呼叫） ----------
window.initCheckoutPage = async function initCheckoutPage() {
  // 元素已被 pages/checkout.html 插入 #app 後，才會被呼叫
  bindShippingEvents();
  bindBack();
  updateShippingUI();
  await loadCartAndRender();
  q('#checkoutForm')?.addEventListener('submit', onSubmitCheckout);
};