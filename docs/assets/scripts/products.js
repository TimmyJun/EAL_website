// ===== products.js (optimized) =====

// 共用：把產品列表轉成 HTML
function renderProductsHTML(products = []) {
  return products.map(p => {
    const v = p.variants?.[0];
    const img = v?.thumbnails?.[0] || 'assets/images/placeholder.png';
    const price = (typeof p.price === 'number' && p.price > 0)
      ? `NT$${p.price.toLocaleString()}`
      : '—';
    return `
      <div class="product-card">
        <div class="product-container">
          <a href="#product?id=${p.id}">
            <img src="${img}" alt="${p.title}" onerror="this.src='assets/images/placeholder.png'">
          </a>
          <h3 class="product-name">${p.title}</h3>
          <span class="product-price">${price}</span>
        </div>
      </div>
    `;
  }).join('');
}

// 解析目前的 hash: '#products?year=2025&type=ss&label=25SS'
function parseHashRoute() {
  const raw = window.location.hash || '';
  const [route, query = ''] = raw.replace(/^#/, '').split('?');
  const sp = new URLSearchParams(query);
  return {
    route,
    year: sp.get('year') ? Number(sp.get('year')) : undefined,
    type: sp.get('type') ? String(sp.get('type')).toLowerCase() : undefined,
    label: sp.get('label') ? String(sp.get('label')) : '',
  };
}

// 依 route 渲染 products 區塊（同頁 SPA）
async function renderProductsByRoute() {
  const listEl = document.querySelector('.products-list');
  const heading = document.querySelector('.products-container .collection-name');
  if (!listEl) return; // 這頁沒有 products 區塊就略過

  const { route, year, type, label } = parseHashRoute();
  if (route !== 'products') return;

  listEl.innerHTML = '載入中…';

  try {
    if (year && type) {
      // 有篩選參數：更新標題 + 依條件撈資料（統一走 service）
      if (heading) heading.textContent = label ? `E’TREALOUEST ${label}` : 'E’TREALOUEST';
      const items = await window.productService.fetchProductsBy({ year, type });
      listEl.innerHTML = Array.isArray(items) && items.length
        ? renderProductsHTML(items)
        : '<p>目前沒有商品</p>';
    } else {
      // 無參數：預設標題 + 撈全部
      if (heading) heading.textContent = 'E’TREALOUEST';
      const products = await fetchProducts(); // 你原本抓全部的函式
      listEl.innerHTML = Array.isArray(products) && products.length
        ? renderProductsHTML(products)
        : '<p>目前沒有商品</p>';
    }
  } catch (err) {
    console.error('[products] render by route failed', err);
    listEl.innerHTML =
      '<p style="text-align: center; color: grey">The collections of this season is now sold out. Please look forward to the next season</p>';
  }
}

// 首次載入 & hash 變更時觸發
window.addEventListener('DOMContentLoaded', renderProductsByRoute);
window.addEventListener('hashchange', renderProductsByRoute);

// 若其他地方仍呼叫 initProductsPage，維持 API 相容
window.initProductsPage = renderProductsByRoute;