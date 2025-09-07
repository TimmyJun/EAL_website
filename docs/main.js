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
  // 這裡千萬別帶上 ?id=...
  fetch(`pages/${page}.html`)
    .then(res => res.text())
    .then(html => {
      app.innerHTML = html;
      loadCSS(page);
      loadScript(page);
      window.scrollTo(0, 0);
    });
}

function loadCSS(page /* 純頁名 */) {
  const linkId = "page-style";
  let link = document.getElementById(linkId);
  if (link) link.remove();

  link = document.createElement('link');
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = `assets/styles/${page}.css`; // ✅ 只用純頁名
  document.head.append(link);
}

function loadScript(page /* 純頁名 */) {
  const scriptId = "page-script";
  let oldScript = document.getElementById(scriptId);
  if (oldScript) oldScript.remove();

  const script = document.createElement("script");
  script.src = `assets/scripts/${page}.js`;    // ✅ 只用純頁名
  script.id = scriptId;

  script.onload = () => {
    const initFunctionName = pageInitMap[page];
    if (typeof window[initFunctionName] === "function") {
      window[initFunctionName]();               // product.js 內部自己用 hash 抓 id
    }
  };

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

window.addEventListener("load", handleRoute);
window.addEventListener("hashchange", handleRoute);
