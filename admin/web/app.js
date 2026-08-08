// EAL 管理後台前端邏輯（vanilla JS）
'use strict';

const API = '/admin/api';
let PRODUCTS = [];        // 列表快取
let CURRENT = null;       // 目前編輯中的完整商品
const SEASONS = ['SS', 'FW', 'AW'];

// ---------- 小工具 ----------
function el(tag, attrs = {}, children = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) n.setAttribute(k, v);
  }
  for (const c of [].concat(children)) if (c) n.append(c);
  return n;
}
function toast(msg, isErr = false) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast show' + (isErr ? ' err' : '');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.className = 'toast', 2400);
}
async function api(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch (_) {}
  if (!res.ok || data.ok === false) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}
const fileToDataURL = file => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = reject;
  r.readAsDataURL(file);
});
function seasonLabel(p) { return `${p.year} ${p.season}`; }

// ---------- 環境橫幅 ----------
async function loadMeta() {
  const b = document.getElementById('envBanner');
  try {
    const { env, bucket, region } = await api('GET', '/meta');
    b.className = 'env-banner ' + env;
    b.textContent = `環境：${env.toUpperCase()}　·　S3：${bucket || '未設定'}（${region || '-'}）` +
      (env === 'prod' ? '　⚠️ 正式環境，所有變更會直接影響線上' : '');
  } catch (e) { b.textContent = '無法取得環境資訊：' + e.message; }
}

// ---------- 商品列表 ----------
async function loadProducts() {
  const { items } = await api('GET', '/products');
  PRODUCTS = items;
  renderList();
}
function renderList() {
  const q = (document.getElementById('search').value || '').trim().toLowerCase();
  const ul = document.getElementById('productList');
  ul.innerHTML = '';
  PRODUCTS.filter(p => !q || p.title.toLowerCase().includes(q)).forEach(p => {
    const li = el('li', {
      class: CURRENT && CURRENT.id === p.id ? 'active' : '',
      onclick: () => selectProduct(p.id),
    }, [
      el('div', { class: 'p-title', html: escapeHtml(p.title) + (p.isArchived ? '<span class="badge-arch">封存</span>' : '') }),
      el('div', { class: 'p-meta', text: `${seasonLabel(p)}　·　${p.variants.length} 色　·　$${p.price}` }),
    ]);
    ul.append(li);
  });
}
function escapeHtml(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

// ---------- 編輯單一商品 ----------
async function selectProduct(id) {
  const { item } = await api('GET', `/products/${id}`);
  CURRENT = item;
  renderList();
  renderEditor();
}

function renderEditor() {
  const p = CURRENT;
  const root = document.getElementById('editor');
  root.innerHTML = '';

  // --- 商品基本資料 ---
  const info = el('div', { class: 'panel' }, [ el('h2', { text: '商品資料' }) ]);
  const f = {};
  info.append(field('標題 Title *', f, 'title', 'text', p.title));
  const row = el('div', { class: 'row' });
  row.append(field('價格 Price', f, 'price', 'number', p.price));
  row.append(field('年份 Year', f, 'year', 'number', p.year));
  row.append(selectField('季別 Season', f, 'season', SEASONS, p.season));
  info.append(row);
  info.append(field('描述 Description（可含 HTML）', f, 'description', 'textarea', p.description || ''));
  const arch = el('label', { class: 'check' }, [
    Object.assign(document.createElement('input'), { type: 'checkbox', checked: p.isArchived }),
    document.createTextNode(' 加入 Archive Sale（封存）'),
  ]);
  f.isArchived = arch.querySelector('input');
  info.append(arch);
  info.append(el('div', { class: 'actions' }, [
    el('button', { class: 'btn btn-primary', text: '儲存商品資料', onclick: () => saveProduct(f) }),
    el('button', { class: 'btn btn-danger', text: '刪除商品', onclick: () => deleteProduct(p.id) }),
  ]));
  root.append(info);

  // --- Variants ---
  const vpanel = el('div', { class: 'panel' }, [ el('h2', { text: `顏色 / 圖片（${p.variants.length}）` }) ]);
  p.variants.forEach(v => vpanel.append(renderVariant(v)));
  vpanel.append(el('div', { class: 'actions' }, [
    el('button', { class: 'btn', text: '＋ 新增顏色 variant', onclick: () => addVariant(p.id) }),
  ]));
  root.append(vpanel);
}

function field(label, store, key, type, value) {
  const input = type === 'textarea'
    ? el('textarea', { rows: 5 })
    : el('input', { type });
  if (type === 'textarea') input.value = value ?? '';
  else input.value = value ?? '';
  store[key] = input;
  return el('div', { class: 'field' }, [ el('label', { text: label }), input ]);
}
function selectField(label, store, key, options, value) {
  const sel = el('select');
  options.forEach(o => sel.append(el('option', { value: o, ...(o === value ? { selected: 'selected' } : {}) }, [document.createTextNode(o)])));
  sel.value = value;
  store[key] = sel;
  return el('div', { class: 'field' }, [ el('label', { text: label }), sel ]);
}

// ---------- Variant 卡片 ----------
function renderVariant(v) {
  const card = el('div', { class: 'variant', 'data-vid': v.id });

  // 標頭：顏色名稱 + 色碼 + 儲存
  const colorInput = el('input', { type: 'text', value: v.color || '', placeholder: '顏色名稱' });
  const codeInput = el('input', { type: 'color', value: /^#([0-9a-f]{6})$/i.test(v.colorCode || '') ? v.colorCode : '#000000', title: v.colorCode || '' });
  const codeText = el('input', { type: 'text', value: v.colorCode || '', placeholder: '#RRGGBB', style: 'width:100px' });
  codeInput.addEventListener('input', () => { codeText.value = codeInput.value; });
  const head = el('div', { class: 'variant-head' }, [
    colorInput, codeInput, codeText,
    el('button', { class: 'btn btn-sm', text: '儲存顏色', onclick: () => saveVariant(v.id, colorInput.value, codeText.value) }),
    el('button', { class: 'btn btn-sm btn-danger', text: '刪除此色', onclick: () => deleteVariant(v.id) }),
  ]);
  card.append(head);

  // 圖片區（可拖拉排序）
  card.append(renderThumbs(v));

  // Sizes
  card.append(renderSizes(v));

  return card;
}

function renderThumbs(v) {
  const wrap = el('div');
  const orderInfo = el('span', { class: 'dirty-order', text: '' });
  const grid = el('div', { class: 'thumbs', 'data-vid': v.id });
  (v.thumbnails || []).forEach((url, i) => grid.append(thumbNode(v.id, url, i)));

  // 啟用拖拉排序
  if (window.Sortable) {
    Sortable.create(grid, {
      animation: 150,
      onEnd: () => { reindex(grid); orderInfo.textContent = '順序已變更，記得按「儲存順序」'; },
    });
  }

  const bar = el('div', { class: 'actions' }, [
    el('label', { class: 'btn btn-sm', html: '＋ 上傳圖片' }, [ makeFileInput(v.id) ]),
    el('button', { class: 'btn btn-sm btn-primary', text: '儲存順序', onclick: () => saveOrder(v.id, grid, orderInfo) }),
    orderInfo,
  ]);
  wrap.append(el('h3', { text: '圖片（拖拉可調整順序）' }), grid, bar);
  return wrap;
}
function thumbNode(vid, url, i) {
  return el('div', { class: 'thumb', 'data-url': url }, [
    el('span', { class: 'idx', text: i + 1 }),
    el('img', { src: url, loading: 'lazy' }),
    el('button', { class: 'del', text: '×', title: '刪除這張', onclick: () => deleteImage(vid, url) }),
  ]);
}
function reindex(grid) {
  [...grid.children].forEach((c, i) => { const b = c.querySelector('.idx'); if (b) b.textContent = i + 1; });
}
function makeFileInput(vid) {
  const inp = el('input', { type: 'file', accept: 'image/*', multiple: 'multiple', style: 'display:none' });
  inp.addEventListener('change', () => uploadImages(vid, inp.files));
  return inp;
}

function renderSizes(v) {
  const wrap = el('div');
  const list = el('div', { 'data-sizes': v.id });
  (v.sizes || []).forEach(s => list.append(sizeRow(s.label, s.stock)));
  wrap.append(
    el('h3', { text: '尺寸 / 庫存' }),
    list,
    el('div', { class: 'actions' }, [
      el('button', { class: 'btn btn-sm', text: '＋ 新增尺寸', onclick: () => list.append(sizeRow('', 0)) }),
      el('button', { class: 'btn btn-sm btn-primary', text: '儲存尺寸/庫存', onclick: () => saveSizes(v.id, list) }),
    ]),
  );
  return wrap;
}
function sizeRow(label, stock) {
  const row = el('div', { class: 'size-row' }, [
    el('input', { type: 'text', 'data-sf': 'label', value: label, placeholder: 'Size（如 1/2/3）' }),
    el('input', { type: 'number', 'data-sf': 'stock', value: stock }),
  ]);
  row.append(el('button', { class: 'btn btn-sm btn-danger', text: '移除', onclick: () => row.remove() }));
  return row;
}

// ---------- 動作 ----------
async function saveProduct(f) {
  try {
    const body = {
      title: f.title.value, price: f.price.value, year: f.year.value,
      season: f.season.value, description: f.description.value, isArchived: f.isArchived.checked,
    };
    await api('PUT', `/products/${CURRENT.id}`, body);
    toast('已儲存商品資料');
    await loadProducts(); await selectProduct(CURRENT.id);
  } catch (e) { toast(e.message, true); }
}
async function deleteProduct(id) {
  if (!confirm('確定刪除整個商品？連同所有顏色、尺寸與 S3 圖片都會刪除，無法復原。')) return;
  try {
    const r = await api('DELETE', `/products/${id}`);
    toast(`已刪除商品（清掉 ${r.deletedImages} 張圖）`);
    CURRENT = null; document.getElementById('editor').innerHTML = '<div class="empty-state">← 從左側選一個商品</div>';
    await loadProducts();
  } catch (e) { toast(e.message, true); }
}
async function addVariant(pid) {
  const color = prompt('新顏色名稱（例如 Black）：'); if (color === null) return;
  try { await api('POST', `/products/${pid}/variants`, { color, sizes: [] }); toast('已新增顏色'); await selectProduct(pid); }
  catch (e) { toast(e.message, true); }
}
async function saveVariant(vid, color, colorCode) {
  try { await api('PUT', `/variants/${vid}`, { color, colorCode }); toast('已儲存顏色'); await selectProduct(CURRENT.id); }
  catch (e) { toast(e.message, true); }
}
async function deleteVariant(vid) {
  if (!confirm('確定刪除這個顏色 variant？連同其尺寸與 S3 圖片一併刪除。')) return;
  try { const r = await api('DELETE', `/variants/${vid}`); toast(`已刪除顏色（清掉 ${r.deletedImages} 張圖）`); await selectProduct(CURRENT.id); }
  catch (e) { toast(e.message, true); }
}
async function saveOrder(vid, grid, orderInfo) {
  const thumbnails = [...grid.children].map(c => c.getAttribute('data-url'));
  try { await api('PUT', `/variants/${vid}/thumbnails`, { thumbnails }); orderInfo.textContent = ''; toast('已儲存新順序'); await refreshCurrentQuietly(); }
  catch (e) { toast(e.message, true); }
}
async function uploadImages(vid, fileList) {
  const files = [...fileList]; if (!files.length) return;
  toast(`上傳 ${files.length} 張圖片中…`);
  try {
    const images = [];
    for (const file of files) images.push({ name: file.name, dataBase64: await fileToDataURL(file) });
    await api('POST', `/variants/${vid}/images`, { images });
    toast('圖片已上傳');
    await selectProduct(CURRENT.id);
  } catch (e) { toast(e.message, true); }
}
async function deleteImage(vid, url) {
  if (!confirm('刪除這張圖片？（同時從 S3 移除）')) return;
  try { await api('DELETE', `/variants/${vid}/images`, { url }); toast('已刪除圖片'); await selectProduct(CURRENT.id); }
  catch (e) { toast(e.message, true); }
}
async function saveSizes(vid, list) {
  const sizes = [...list.querySelectorAll('.size-row')].map(r => ({
    label: r.querySelector('[data-sf="label"]').value.trim(),
    stock: r.querySelector('[data-sf="stock"]').value,
  })).filter(s => s.label !== '');
  try { await api('PUT', `/variants/${vid}/sizes`, { sizes }); toast('已儲存尺寸/庫存'); await refreshCurrentQuietly(); }
  catch (e) { toast(e.message, true); }
}
// 靜默刷新 CURRENT（不整頁重繪，避免打斷操作）
async function refreshCurrentQuietly() {
  if (!CURRENT) return;
  const { item } = await api('GET', `/products/${CURRENT.id}`);
  CURRENT = item;
}

// ---------- 新增商品 ----------
function openNewProduct() {
  const root = document.getElementById('editor');
  root.innerHTML = '';
  const node = document.getElementById('tplNewProduct').content.cloneNode(true);
  const panel = node.querySelector('.panel');
  panel.querySelector('[data-f="year"]').value = new Date().getFullYear();
  panel.querySelector('[data-act="create"]').addEventListener('click', () => createProduct(panel));
  panel.querySelector('[data-act="cancel"]').addEventListener('click', () => {
    root.innerHTML = '<div class="empty-state">← 從左側選一個商品</div>';
  });
  root.append(node);
}
async function createProduct(panel) {
  const g = k => panel.querySelector(`[data-f="${k}"]`);
  const body = {
    title: g('title').value.trim(), price: g('price').value, year: g('year').value,
    season: g('season').value, description: g('description').value, isArchived: g('isArchived').checked,
    variants: [],
  };
  if (!body.title) return toast('請填標題', true);
  try {
    const { item } = await api('POST', '/products', body);
    toast('已建立商品');
    await loadProducts();
    await selectProduct(item.id);
  } catch (e) { toast(e.message, true); }
}

// ---------- 啟動 ----------
document.getElementById('search').addEventListener('input', renderList);
document.getElementById('btnNew').addEventListener('click', openNewProduct);
loadMeta();
loadProducts().catch(e => toast('載入商品失敗：' + e.message, true));
