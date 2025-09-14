const app = document.getElementById('app');

const pageInitMap = {
  home: "initScrollObserver",
  product: "initProductPage",
  products: "initProductsPage",
};

// 解析 hash -> { page: 'product', query: 'id=xxx' }
function parseHash() {
  const raw = (location.hash || '').slice(1);   // '#product?id=xxx' -> 'product?id=xxx'
  const [page, query = ''] = raw.split('?');
  return { page: page || 'home', query };
}

function loadPage(page /* 只放純頁名 */) {
  fetch(`pages/${page}.html`, { cache: 'no-store' })
    .then(res => res.ok ? res.text() : Promise.reject(new Error(`pages/${page}.html not found`)))
    .then(html => {
      app.innerHTML = html;
      loadCSS(page);
      loadScript(page);
      window.scrollTo(0, 0);
    })
    .catch(err => {
      console.error('[loadPage] ', err);
      app.innerHTML = `<main style="padding:2rem"><h2>頁面載入失敗</h2><pre>${String(err.message || err)}</pre></main>`;
    });
}

function loadCSS(page /* 純頁名 */) {
  const linkId = "page-style";
  let link = document.getElementById(linkId);
  if (link) link.remove();

  link = document.createElement('link');
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = `assets/styles/${page}.css`;
  document.head.append(link);
}

function loadScript(page /* 純頁名 */) {
  const scriptId = "page-script";
  let oldScript = document.getElementById(scriptId);
  if (oldScript) oldScript.remove();

  const script = document.createElement("script");
  script.src = `assets/scripts/${page}.js`;
  script.id = scriptId;

  script.onload = () => {
    const initFunctionName = pageInitMap[page];
    if (typeof window[initFunctionName] === "function") {
      window[initFunctionName]();               // product.js 內部自己用 hash 抓 id
    }
  };
  script.onerror = (e) => console.error('[loadScript] 無法載入', script.src, e);

  document.body.appendChild(script);
}

function closeMenu() {
  document.getElementById("menu-toggle")?.classList.remove("open");
  document.getElementById("overlay-menu")?.classList.remove("open");
}

function handleRoute() {
  const { page } = parseHash(); // ✅ 只取純頁名
  loadPage(page);
  closeMenu();
}

// 若 config-loader.js 未載入，保險建立
if (!window.CONFIG_READY) {
  window.CONFIG = window.CONFIG || {};
  window.CONFIG.API_BASE = window.CONFIG.API_BASE || 'http://localhost:3000';
  window.CONFIG_READY = Promise.resolve();
}

// 啟動
window.addEventListener("DOMContentLoaded", handleRoute);
window.addEventListener("hashchange", handleRoute);