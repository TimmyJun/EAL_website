(function () {
  // 若 config-loader.js 未正確載入，保險處理
  if (!window.CONFIG_READY) {
    window.CONFIG = window.CONFIG || {};
    window.CONFIG.API_BASE = window.CONFIG.API_BASE || 'http://localhost:3000'
    window.CONFIG.CACHE_VERSION = window.CONFIG.CACHE_VERSION || 'v1'
    window.CONFIG_READY = Promise.resolve()
  }

  const IS_DEV = !/production/i.test(String(window.NODE_ENV || '')) && 
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1')

  function buildApiBase() {
    return window.CONFIG.API_BASE || 'http://localhost:3000';
  }

  function cacheMode(forceFresh = false) {
    return 'no-store';
  }

  function withTs(url, forceFresh = false) {
    if(!(IS_DEV || forceFresh)) return url
    const u = new URL(url)
    u.searchParams.set('_ts', Date.now().toString()) // 破壞快取參數
    return u.toString()
  }

  // 簡易記憶體快取（TTL）
  const memoryCache = new Map()

  function withCache(key, ttlMs, loader, forceFresh = false) {
    // 開發或 forceFresh 時繞過記憶體快取
    if (IS_DEV || forceFresh) return Promise.resolve().then(loader)
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

  async function fetchProducts({fresh = false} = {}) {
    await window.CONFIG_READY;
    const key = `products:all:${window.CONFIG.CACHE_VERSION}`
    return withCache(key, 60_000, async() => {
      const url = withTs(api('/api/products'), fresh)
      const res = await fetch(url, { cache: cacheMode(fresh) })
      if (!res.ok) throw new Error(`Fetch products failed: ${res.status}`)
      return res.json()
    }, fresh)
  }

  async function fetchProductById(id, {fresh = false} = {}) {
    await window.CONFIG_READY
    const key = `products:id:${window.CONFIG.CACHE_VERSION}:${id}`
    const url = withTs(api(`/api/products/${encodeURIComponent(id)}`), fresh)
    return withCache(key, 60_000, async () => {
      const res = await fetch(url, {cache: cacheMode(fresh)})
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('fetchProductById failed', res.status, text);
        throw new Error(`Fetch product failed: ${res.status}`);
      }
      return res.json();
    }, fresh)
  }

  async function fetchProductsBy({ year, type, fresh = false } = {}) {
    await window.CONFIG_READY;
    const baseUrl = new URL(api('/api/products'), window.location.origin);
    if (year) baseUrl.searchParams.set('year', String(year));
    if (type) baseUrl.searchParams.set('type', String(type));
    const key = `products:query:${window.CONFIG.CACHE_VERSION}:${year || ''}:${type || ''}`
    const url = withTs(baseUrl.toString(), fresh)
    return withCache(key, 60_000, async () => {
      const res = await fetch(url, { cache: cacheMode(fresh) });
      if (!res.ok) throw new Error(`Fetch products failed: ${res.status}`);
      return res.json();
    }, fresh)
  }

  async function fetchSeasonTags({fresh = false} = {}) {
    await window.CONFIG_READY
    const key = `products:season-tags:${window.CONFIG.CACHE_VERSION}`
    const url = withTs(api('/api/products/collections/season-tags'), fresh)
    return withCache(key, 3_600_000, async () => {
      const res = await fetch(url, { cache: cacheMode(fresh) })
      if (!res.ok) throw new Error(`Fetch season tags failed: ${res.status}`);
      return res.json();
    }, fresh)
  }

  function invalidateCache(prefix = '') {
    Array.from(memoryCache.keys()).forEach(k => {
      if (!prefix || String(k).startsWith(prefix)) memoryCache.delete(k)
    })
  }

  async function fetchByIds(ids = []) {
    await window.CONFIG_READY;
    const uniq = [...new Set(ids.filter(Boolean))];
    if (!uniq.length) return {};

    // 後端提供 /api/products/batch?ids=... 介面
    const url = new URL(api('/api/products/batch'));
    url.searchParams.set('ids', uniq.join(','));

    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) throw new Error(`batch fetch failed: ${res.status}`);
    const list = await res.json(); // 假設回傳 [{id, title, price, variants:[{color, thumbnails:[]}]}, ...]

    const map = {};
    for (const p of list) {
      const first = p.variants?.[0];
      const fallbackImg = first?.thumbnails?.[0] || 'assets/images/placeholder.png';
      const images = {};
      (p.variants || []).forEach(v => { images[v.color] = v.thumbnails?.[0] || fallbackImg; });

      map[p.id] = {
        title: p.title,
        price: Number(p.price) || 0,
        image: fallbackImg,
        images,
        currency: 'TWD',
      };
    }
    return map;
  }

  async function checkStock(items = []) {
    await window.CONFIG_READY;
    const url = api('/api/products/stock/check');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store', // 確保即時查詢
      body: JSON.stringify({ items }),
    });
    if (!res.ok) throw new Error(`checkStock failed: ${res.status}`);
    return res.json(); // 回傳 { ok: true } 或 { ok: false, issues: [...] }
  }

  // ---- 導出（同時提供全域函式與命名空間）----
  window.fetchProducts = fetchProducts;
  window.fetchProductById = fetchProductById;
  window.fetchProductsBy = fetchProductsBy;
  window.fetchSeasonTags = fetchSeasonTags;

  window.productService = {
    fetchByIds,
    fetchProductsBy,
    fetchSeasonTags,
    invalidateCache,
    checkStock
  };
})();