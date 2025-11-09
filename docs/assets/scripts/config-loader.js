window.CONFIG = {};
window.CONFIG_READY = (async () => {
  async function load(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${url}`);
    return res.json();
  }
  // 1) 優先讀本地專用 config.local.json
  try {
    const local = await load("./config.local.json");
    Object.assign(window.CONFIG, local);
    console.log("[config] loaded config.local.json", window.CONFIG)
    return
  } catch (_) {
    // 沒有就當作不是本地（這是正常的）
  }
  // 2) 根據 hostname 決定要用哪一個正式設定檔
  let configUrl = "./config.json"
  const host = window.location.hostname

  if (host === "timmyjun.github.io") {
    configUrl = "./config.staging.json"
  }else if (host === "eal.com.tw") {
    configUrl = "./config.prod.json"
  }else {
    configUrl = "./config.json"
  }

  try {
    const cfg = await load("./config.json")
    Object.assign(window.CONFIG, cfg)
    console.log("[config] loaded", configUrl, window.CONFIG)
  } catch (e) {
    console.error("[config] load failed:", e);
    window.CONFIG.API_BASE = "http://localhost:3000"
    window.CONFIG.ENV = "fallback"
  }
})()