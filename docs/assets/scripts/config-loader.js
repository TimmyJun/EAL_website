// 會先嘗試讀本地 config.local.json（本地開發專用，git 忽略）
// 若讀不到，再讀正式的 config.json（GitHub Pages 用）
window.CONFIG = {};
window.CONFIG_READY = (async () => {
  async function load(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${url}`);
    return res.json();
  }
  try {
    // 優先讀 local 覆蓋
    const local = await load("./config.local.json");
    Object.assign(window.CONFIG, local);
    return;
  } catch (_) {
    // ignore
  }
  try {
    const cfg = await load("./config.json");
    Object.assign(window.CONFIG, cfg);
  } catch (e) {
    console.error("[config] load failed:", e);
    // 最後保險：給個預設，避免整站掛掉
    window.CONFIG.API_BASE = "http://localhost:3000";
  }
})()