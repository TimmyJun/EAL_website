function api(path) {
  return `${window.CONFIG.API_BASE}${path}`;
}

async function fetchProducts() {
  const res = await fetch(api('/api/products'));
  if (!res.ok) throw new Error(`Fetch products failed: ${res.status}`);
  return res.json();
}

async function fetchProductById(id) {
  const url = api(`/api/products/${encodeURIComponent(id)}`);
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('fetchProductById failed', res.status, text);
    throw new Error(`Fetch product failed: ${res.status}`);
  }
  return res.json();
}

async function fetchProductsBy({ year, type } = {}) {
  const url = new URL(api('/api/products'), window.location.origin);
  if (year) url.searchParams.set('year', String(year));
  if (type) url.searchParams.set('type', String(type)); // 'ss' | 'fw'
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch products failed: ${res.status}`);
  return res.json();
}

async function fetchSeasonTags() {
  const res = await fetch(api('/api/products/collections/season-tags'), { cache: 'no-store' });
  if (!res.ok) throw new Error(`Fetch season tags failed: ${res.status}`);
  return res.json();
}

(function () {
  // 用現有的 fetchProductById 逐一取回，組成 side cart 需要的顯示資料
  async function fetchByIds(ids = []) {
    const uniq = Array.from(new Set((ids || []).filter(Boolean)));
    if (!uniq.length) return {};

    const results = await Promise.all(
      uniq.map(id => fetchProductById(id).catch(() => null))
    );

    const map = {};
    results.forEach((p, i) => {
      if (!p) return;
      const id = uniq[i];
      const firstVariant = p.variants?.[0];
      const fallbackImg = firstVariant?.thumbnails?.[0] || 'assets/images/placeholder.png';

      // 各色代表圖（取每個變體的第一張縮圖）
      const images = {};
      (p.variants || []).forEach(v => {
        images[v.color] = v.thumbnails?.[0] || fallbackImg;
      });

      map[id] = {
        title: p.title,
        price: Number(p.price) || 0,
        image: fallbackImg,
        images,              // 讓購物車可依 color 顯示對應縮圖
        currency: 'TWD',
      };
    });

    return map;
  }

  // 供 cart-slideout-panel 呼叫：window.productService.fetchByIds(ids)
  window.productService = { 
    fetchByIds,
    fetchProductsBy,
    fetchSeasonTags
  }
}) ();