// // 簡單的產品服務：讀 /mock/products.json，做快取，並支援批次 ids 查詢
// window.productService = (() => {
//   const cache = new Map(); // id -> meta
//   let loaded = false, loadingPromise = null;

//   function prime(arr = []) { arr.forEach(p => p?.id && cache.set(p.id, p)); }
//   const get = (id) => cache.get(id);

//   async function loadAll() {
//     if (loaded) return;
//     if (!loadingPromise) {
//       // 相對路徑，不要以 / 開頭，才能在 GitHub Pages 子路徑運作
//       loadingPromise = fetch('mock/products.json')
//         .then(r => { if (!r.ok) throw new Error('load products.json failed'); return r.json(); })
//         .then(list => { list.forEach(p => p?.id && cache.set(p.id, p)); loaded = true; });
//     }
//     return loadingPromise;
//   }

//   async function fetchByIds(ids = []) {
//     await loadAll();
//     const out = {};
//     ids.forEach(id => { if (cache.has(id)) out[id] = cache.get(id); });
//     return out; // { id: meta }
//   }

//   return { fetchByIds, prime, get };
// })();
