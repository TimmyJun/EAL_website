function renderProductsHTML(products = []) {
  return products.map(p => {
    const v = p.variants?.[0];
    const img = v?.thumbnails?.[0] || 'assets/images/placeholder.jpg';
    const fmt = (n) => `NT$${Number(n).toLocaleString()}`;
    const hasPrice = typeof p.price === 'number' && p.price > 0;
    const onSale = hasPrice && p.onSale && typeof p.salePrice === 'number' && p.salePrice < p.price;
    const price = !hasPrice
      ? '—'
      : (onSale
        ? `<span class="price-original">${fmt(p.price)}</span> ${fmt(p.salePrice)}`
        : fmt(p.price));
    return `
      <div class="product-card">
        <div class="product-container">
          <a href="#product?id=${p.id}">
            <img src="${img}" alt="${p.title}" onerror="this.src='assets/images/placeholder.jpg'">
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
    archived: sp.get('archived') === '1' || sp.get('archived') === 'true',
    womens: sp.get('womens') === '1' || sp.get('womens') === 'true',
    label: sp.get('label') ? String(sp.get('label')) : '',
  };
}

// 依 route 渲染 products 區塊（同頁 SPA）
async function renderProductsByRoute() {
  const listEl = document.querySelector('.products-list');
  const heading = document.querySelector('.products-container .collection-name');
  if (!listEl) return;

  const { route, year, type, archived, womens, label } = parseHashRoute();
  if (route !== 'products') return;

  listEl.innerHTML = '載入中…';

  try {
    if (archived) {
      if (heading) heading.textContent = label ? `E’TREALOUEST ${label}` : 'E’TREALOUEST Archive Sale';
      const items = await window.productService.fetchProductsBy({ archived: true });
      listEl.innerHTML = Array.isArray(items) && items.length
        ? renderProductsHTML(items)
        : '<p>目前沒有商品</p>';
    } else if (womens) {
      if (heading) heading.textContent = label ? `E’TREALOUEST ${label}` : 'E’TREALOUEST 女裝';
      const items = await window.productService.fetchProductsBy({ womens: true });
      listEl.innerHTML = Array.isArray(items) && items.length
        ? renderProductsHTML(items)
        : '<p>目前沒有商品</p>';
    } else if (year && type) {
      if (heading) heading.textContent = label ? `E’TREALOUEST ${label}` : 'E’TREALOUEST';
      const items = await window.productService.fetchProductsBy({ year, type });
      listEl.innerHTML = Array.isArray(items) && items.length
        ? renderProductsHTML(items)
        : '<p>目前沒有商品</p>';
    } else {
      if (heading) heading.textContent = 'E’TREALOUEST';
      const products = await fetchProducts();
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

window.addEventListener('DOMContentLoaded', renderProductsByRoute);
window.addEventListener('hashchange', renderProductsByRoute);

// 維持相容
window.initProductsPage = renderProductsByRoute;