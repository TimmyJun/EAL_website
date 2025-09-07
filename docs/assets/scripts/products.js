window.initProductsPage = async function initProductsPage() {
  // 你的 products.html 裡要有 .products-list 容器（你已經有）
  const listEl = document.querySelector('.products-list');
  if (!listEl) {
    console.error('找不到 .products-list 容器');
    return;
  }

  listEl.innerHTML = '載入中…';

  try {
    // 這個函式來自你已經在 index.html 引入的 productsService.js
    const products = await fetchProducts();
    console.log('✅ /api/products 回傳:', products);

    if (!Array.isArray(products) || products.length === 0) {
      listEl.innerHTML = '<p>目前沒有商品</p>';
      return;
    }

    listEl.innerHTML = products.map(p => {
      const v = p.variants?.[0];                         // 先顯示第一個顏色
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
  } catch (err) {
    console.error(err);
    listEl.innerHTML = '<p style="text-align: center; color: grey">The collections of this season is now sold out. Please look forward to the next season</p>';
  }
}