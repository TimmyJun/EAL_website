const app = document.getElementById('app')

const pageInitMap = {
  home: "initScrollObserver",
  product: "initProductPage",
};

function loadPage(page) {
  fetch(`pages/${page}.html`)
    .then(res => res.text())
    .then(html => {
      app.innerHTML = html
      loadCSS(page)
      loadScript(page)
      window.scrollTo(0, 0)
    })
}

function loadCSS(page) {
  const linkId = "page-style"
  let link = document.getElementById(linkId)

  //移除舊的樣式
  if (link) {
    link.remove()
  }

  //建立新的<link>
  link = document.createElement('link')
  link.id = linkId
  link.rel = "stylesheet"
  link.href = `assets/styles/${page}.css` // 對應 home.css、products.css 等

  document.head.append(link)
}

function loadScript(page) {
  const scriptId = "page-script";
  let oldScript = document.getElementById(scriptId)
  if (oldScript) oldScript.remove(); // 移除舊的

  const script = document.createElement("script")
  script.src = `assets/scripts/${page}.js`
  script.id = scriptId

  //等 JS 載入完再初始化 scroll observer
  script.onload = () => {
    const initFunctionName = pageInitMap[page]
    if (typeof window[initFunctionName] === "function") {
      window[initFunctionName]()
    }
  }

  document.body.appendChild(script)
}

function closeMenu() {
  document.getElementById("menu-toggle")?.classList.remove("open")
  document.getElementById("overlay-menu")?.classList.remove("open")
}

function handleRoute() {
  const hash = location.hash.slice(1) // #home -> home
  const page = hash || "home"
  loadPage(page)

  // 關閉選單
  closeMenu()
}

//初次載入
window.addEventListener("load", handleRoute)

//切換 hash 時觸發
window.addEventListener("hashchange", handleRoute)