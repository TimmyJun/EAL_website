(function () {
  // 若 config-loader.js 未正確載入，保險處理
  if (!window.CONFIG_READY) {
    window.CONFIG = window.CONFIG || {};
    window.CONFIG.API_BASE = window.CONFIG.API_BASE || 'http://localhost:3000';
    window.CONFIG_READY = Promise.resolve();
  }

  function buildApiBase() {
    return window.CONFIG.API_BASE || 'http://localhost:3000';
  }

  function apiFetch(path, opt = {}) {
    const API_BASE = buildApiBase();
    const url = `${API_BASE}${path}`;
    return fetch(url, {
      cache: 'force-cache',
      credentials: 'omit',
      ...opt
    }).then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`API ${res.status} ${res.statusText} @ ${url}\n${text}`);
      }
      const ct = res.headers.get('content-type') || '';
      return ct.includes('application/json') ? res.json() : res.text();
    });
  }

  // 簡易記憶體快取（TTL）
  const memoryCache = new Map();
  function withCache(key, ttlMs, loader) {
    const now = Date.now();
    const cached = memoryCache.get(key);
    if (cached && cached.expiry > now) return Promise.resolve(cached.data);
    return Promise.resolve()
      .then(loader)
      .then(data => {
        memoryCache.set(key, { expiry: now + ttlMs, data });
        return data;
      });
  }

  // ---- 你現有的全域函式（保持相容）----
  function api(path) { return `${buildApiBase()}${path}`; }

  async function fetchProducts() {
    await window.CONFIG_READY;
    return withCache('products:all', 60_000, async () => {
      const res = await fetch(api('/api/products'), { cache: 'force-cache' });
      if (!res.ok) throw new Error(`Fetch products failed: ${res.status}`);
      return res.json();
    });
  }

  async function fetchProductById(id) {
    await window.CONFIG_READY;
    const url = api(`/api/products/${encodeURIComponent(id)}`);
    return withCache(`products:id:${id}`, 60_000, async () => {
      const res = await fetch(url, { cache: 'force-cache' });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('fetchProductById failed', res.status, text);
        throw new Error(`Fetch product failed: ${res.status}`);
      }
      return res.json();
    });
  }

  async function fetchProductsBy({ year, type } = {}) {
    await window.CONFIG_READY;
    const baseUrl = new URL(api('/api/products'), window.location.origin);
    if (year) baseUrl.searchParams.set('year', String(year));
    if (type) baseUrl.searchParams.set('type', String(type));
    const key = `products:query:${year || ''}:${type || ''}`;
    return withCache(key, 60_000, async () => {
      const res = await fetch(baseUrl.toString(), { cache: 'force-cache' });
      if (!res.ok) throw new Error(`Fetch products failed: ${res.status}`);
      return res.json();
    });
  }

  async function fetchSeasonTags() {
    await window.CONFIG_READY;
    return withCache('products:season-tags', 3_600_000, async () => {
      const res = await fetch(api('/api/products/collections/season-tags'), { cache: 'force-cache' });
      if (!res.ok) throw new Error(`Fetch season tags failed: ${res.status}`);
      return res.json();
    });
  }

  // ---- 給 side cart 批次用：依 id 取展示 meta ----
  async function fetchByIds(ids = []) {
    await window.CONFIG_READY;
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

      const images = {};
      (p.variants || []).forEach(v => { images[v.color] = v.thumbnails?.[0] || fallbackImg; });

      map[id] = {
        title: p.title,
        price: Number(p.price) || 0,
        image: fallbackImg,
        images,
        currency: 'TWD',
      };
    });

    return map;
  }

  // ---- 導出（同時提供全域函式與命名空間）----
  window.fetchProducts = fetchProducts;
  window.fetchProductById = fetchProductById;
  window.fetchProductsBy = fetchProductsBy;
  window.fetchSeasonTags = fetchSeasonTags;

  window.productService = {
    fetchByIds,
    fetchProductsBy,
    fetchSeasonTags
  };
})();