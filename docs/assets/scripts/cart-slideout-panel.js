// cart-slideout-panel.js
const cartPanel = document.getElementById('cartPanel');
const cartOverlay = document.getElementById('cartOverlay');
const cartItemsEl = document.getElementById('cartItems');
const cartSubtotalEl = document.getElementById('cartSubtotal');
const cartCloseBtn = document.getElementById('cartCloseBtn');
const checkoutBtn = document.getElementById('checkoutBtn');
const cartToggleEls = [document.getElementById('cartToggleBtn')].filter(Boolean)
const __stockCache = new Map(); // id -> { [color]: { [size]: stock } }

async function __ensureStockMapForId(id) {
  if (__stockCache.has(id)) return __stockCache.get(id);
  const p = await fetchProductById(id); // 直接用你現成的 API
  const map = {};
  (p.variants || []).forEach(v => {
    const color = v.color;
    map[color] = map[color] || {};
    (v.sizes || []).forEach(s => {
      map[color][s.label] = Math.max(0, Number(s.stock) || 0);
    });
  });
  __stockCache.set(id, map);
  return map;
}

async function getVariantStock(id, color = '-', size = '-') {
  const m = await __ensureStockMapForId(id);
  return m?.[color]?.[size] ?? 0;
}

// 你可在別處提供商品資料：window.__productCatalog 或 window.getProductMeta(id)
function resolveProductMeta(id) {
  if (window.__productCatalog && window.__productCatalog[id]) return window.__productCatalog[id];
  if (typeof window.getProductMeta === 'function') return window.getProductMeta(id) || {};
  return {};
}

const fmtMoney = (n, currency = 'TWD', locale = 'zh-TW') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(n) || 0)

const escapeHTML = (s = '') => s.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]))

const calcSubtotal = rows => rows.reduce((sum, r) => sum + (Number(r.price) || 0) * (r.qty || 0), 0);

// 開/關 + a11y
let lastFocusedEl = null, focusInTrap = false;
function openCart() {
  lastFocusedEl = document.activeElement;
  renderCartAsync()
  cartPanel.classList.add('is-open'); cartOverlay.classList.add('is-open');
  cartPanel.setAttribute('aria-hidden', 'false'); cartOverlay.setAttribute('aria-hidden', 'false');
  document.documentElement.style.overflow = 'hidden'; cartPanel.focus(); trapFocus(cartPanel, true);
}
function closeCart() {
  cartPanel.classList.remove('is-open'); cartOverlay.classList.remove('is-open');
  cartPanel.setAttribute('aria-hidden', 'true'); cartOverlay.setAttribute('aria-hidden', 'true');
  document.documentElement.style.overflow = ''; trapFocus(cartPanel, false); if (lastFocusedEl) lastFocusedEl.focus();
}
function trapFocus(container, enable) {
  if (enable && !focusInTrap) { focusInTrap = true; document.addEventListener('focus', handler, true); }
  else if (!enable && focusInTrap) { focusInTrap = false; document.removeEventListener('focus', handler, true); }
  function handler(e) { if (!container.contains(e.target)) { e.stopPropagation(); container.focus(); } }
}

// 綁定
cartOverlay?.addEventListener('click', closeCart);
cartCloseBtn?.addEventListener('click', closeCart);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && cartPanel?.classList.contains('is-open')) closeCart(); });
cartToggleEls.forEach(el => el.addEventListener('click', (e) => { if (el.tagName === 'A') e.preventDefault(); openCart(); }));
document.querySelectorAll('a[href="#cart"]').forEach(a => a.addEventListener('click', (e) => { e.preventDefault(); openCart(); }));

// 渲染（以 cartStore 為準）
async function renderCartAsync() {
  const entries = window.cartStore?.entries() || []; // [{key, id, color, size, qty}]
  if (!entries.length) {
    cartItemsEl.innerHTML = `<p style="text-align: center;">Your cart is empty now</p>`;
    cartSubtotalEl.textContent = fmtMoney(0);
    return;
  }

  // 先畫骨架
  cartItemsEl.innerHTML = entries.map(e => `
    <div class="cart-item" data-key="${e.key}">
      <div class="cart-item__thumb skeleton"></div>
      <div>
        <p class="cart-item__title skeleton">&nbsp;</p>
        <p class="cart-item__meta"><span class="skeleton">&nbsp;</span> × ${e.qty}</p>
        <div class="qty-control">
          <button class="qty-btn" data-action="dec">-</button>
          <span>${e.qty}</span>
          <button class="qty-btn" data-action="inc">+</button>
          <button class="qty-btn" data-action="remove">🗑</button>
        </div>
      </div>
      <div class="price skeleton">&nbsp;</div>
    </div>
  `).join('');
  cartSubtotalEl.textContent = '…';

  // 1) 批次拿 meta（標題/價格/圖片）
  const ids = entries.map(e => e.id);
  const metaMap = await window.productService.fetchByIds(ids); // 你現有的實作會回 {id:{title,price,image,images,…}}

  // 2) 批次拿庫存（同一 id 只抓一次）
  const stockMapById = {};
  const uniqueIds = Array.from(new Set(ids));
  await Promise.all(uniqueIds.map(async (id) => {
    stockMapById[id] = await __ensureStockMapForId(id); // { color: { size: stock } }
  }));

  // 3) 真正渲染（並對超量進行回調）
  let subtotal = 0;
  cartItemsEl.innerHTML = entries.map(({ key, id, color, size, qty }) => {
    const m = metaMap[id] || {};
    const price = Number(m.price) || 0;
    const img = (m.images && m.images[color]) || m.image || '';
    const title = m.title || id;
    const currency = m.currency || 'TWD';

    // 計算庫存上限
    const maxStock = stockMapById[id]?.[color]?.[size] ?? 0;

    // 若目前 qty > 庫存，上線提示 & 立即回寫 store（下次 render 會是正確值）
    let finalQty = Math.max(0, Math.min(qty, maxStock || 0));
    if (maxStock > 0 && qty > maxStock) {
      window.cartStore?.setQtyByKey(key, finalQty);
      // 小提示（可換成你自己的 toast）
      try { showToast?.(`「${title}」${color}/${size} 已超過庫存，已調整為 ${finalQty}`); } catch { }
    }

    subtotal += price * finalQty;

    const metaText = [color !== '-' ? color : null, size !== '-' ? size : null]
      .filter(Boolean).join(' / ');

    // 畫面上把「＋」在達到上限時 disabled，並把 max 寫入 dataset
    const disableInc = maxStock > 0 && finalQty >= maxStock;

    return `
      <div class="cart-item" data-key="${key}" data-max="${maxStock}">
        <img class="cart-item__thumb" src="${img}" alt="">
        <div>
          <p class="cart-item__title">${escapeHTML(title)}</p>
          <p class="cart-item__meta">${escapeHTML(metaText)} ${metaText ? ' · ' : ''}${fmtMoney(price, currency)} × <span class="qty-text">${finalQty}</span></p>
          <div class="qty-control">
            <button class="qty-btn" data-action="dec" aria-label="Decrease quantity">-</button>
            <span aria-live="polite">${finalQty}</span>
            <button class="qty-btn" data-action="inc" aria-label="Increase quantity" ${disableInc ? 'disabled' : ''}>+</button>
            <button class="qty-btn remove-btn" data-action="remove" aria-label="Remove item">🗑</button>
          </div>
        </div>
        <div class="price">${fmtMoney(price * finalQty, currency)}</div>
      </div>
    `;
  }).join('');

  cartSubtotalEl.textContent = fmtMoney(subtotal, 'TWD');
}

// 事件代理：寫回 store（透過 cart:updated → 讓面板/徽章都更新）
cartItemsEl?.addEventListener('click', async (e) => {
  const btn = e.target.closest('.qty-btn'); if (!btn) return;
  const itemEl = e.target.closest('.cart-item'); if (!itemEl) return;

  const key = itemEl.dataset.key; if (!key) return;
  const action = btn.dataset.action;

  if (action === 'remove') { window.cartStore?.removeByKey(key); return; }

  // 讀取目前數量與 max
  const curQty = Number(itemEl.querySelector('.qty-control span')?.textContent || 0) || 0;
  const max = Number(itemEl.dataset.max || 0) || 0;

  if (action === 'inc') {
    if (max > 0 && curQty >= max) {
      try { showToast?.(`已達庫存上限：${max}`); } catch { }
      return; // 超過上限就不動
    }
    window.cartStore?.incByKey(key, 1);
  }

  if (action === 'dec') {
    if (curQty <= 1) {
      // 視需求：減到 0 是否直接刪除？以下示例保留 ≥1：
      // window.cartStore?.removeByKey(key); return;
      return; // 不讓小於 1
    }
    window.cartStore?.incByKey(key, -1);
  }
});

// 同步更新（面板開著才重繪）
window.addEventListener('cart:updated', () => {
  if (cartPanel?.classList.contains('is-open')) renderCartAsync();;
});

// 可選導頁/動作
checkoutBtn?.addEventListener('click', () => { /* location.hash = '#/checkout'; */ closeCart(); });

// 讓外部可呼叫
window.openCart = openCart
window.closeCart = closeCart
