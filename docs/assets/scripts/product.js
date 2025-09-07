// docs/assets/scripts/product.js
(() => {
  // ===========================
  // 0) 常數 & Selector
  // ===========================
  const QTY_MIN = 1;
  const QTY_MAX = 99;
  const PLACEHOLDER_IMG = 'assets/images/placeholder.png';

  const SEL = {
    pageRoot: '.product-container',
    mainPhoto: '.main-photo',
    colorBtns: '.color-btn',
    sizeOpts: '.size-option',
    thumbGroups: '.product-thumbnails',
    thumbs: '.product-thumbnail',
    qtyInput: '#product-quantity',
    addBtn: '.add-to-cart',
    sizeList: '.size-list',
  };

  // ===========================
  // 1) 小工具（DOM / 數字）
  // ===========================
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const toInt = (v, def = 0) => { const n = parseInt(v, 10); return Number.isNaN(n) ? def : n; };
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const fmtPrice = (n) => (typeof n === 'number' && n > 0) ? `NT$${n.toLocaleString()}` : '—';
  const readProductIdFromHash = () => {
    const hash = location.hash || '';
    const q = new URLSearchParams(hash.split('?')[1] || '');
    return q.get('id') || '';
  };

  // ===========================
  // 2) 事件委派：單選按鈕
  // ===========================
  // 備註：綁在 root 上，新/舊節點都有效；會忽略 disabled
  function bindSingleSelect(root, selector, activeClass, onChange) {
    // 第一次補預設 active（第一個可點的）
    function ensureDefaultActive() {
      const items = $$(selector, root).filter(i => !i.disabled);
      if (items.length && !items.some(el => el.classList.contains(activeClass))) {
        items[0].classList.add(activeClass);
      }
    }
    ensureDefaultActive();

    root.addEventListener('click', (e) => {
      const el = e.target.closest(selector);
      if (!el || !root.contains(el) || el.disabled) return;
      $$(selector, root).forEach(i => i.classList.remove(activeClass));
      el.classList.add(activeClass);
      onChange?.(el);
    });

    return { ensureDefaultActive };
  }

  // ===========================
  // 3) 庫存輔助
  // ===========================
  function findVariantByColor(product, color) {
    return (product.variants || []).find(v => v.color === color) || null;
  }
  function sumVariantStock(variant) {
    return (variant?.sizes || []).reduce((s, sz) => s + Math.max(0, Number(sz.stock) || 0), 0);
  }
  function getStock(product, color, size) {
    const v = findVariantByColor(product, color);
    if (!v) return 0;
    const s = (v.sizes || []).find(x => (x.label || '') === size);
    return Math.max(0, Number(s?.stock) || 0);
  }
  function setQtyMax(input, maxStock) {
    const max = Math.max(1, Number(maxStock) || 1);
    input.max = String(max);
    input.value = String(clamp(toInt(input.value || 1, 1), 1, max));
  }

  // ===========================
  // 4) 視覺行為（縮圖/主圖）
  // ===========================
  function setMainPhotoByFirstThumbOfGroup(mainPhotoEl, groupEl) {
    const firstThumb = $(SEL.thumbs, groupEl);
    const src = firstThumb?.getAttribute('src') || firstThumb?.dataset.src || '';
    if (src && mainPhotoEl) mainPhotoEl.src = src;
  }
  function toggleThumbGroupsByColor(root, color) {
    $$(SEL.thumbGroups, root).forEach(g => {
      const match = g.dataset.color === color;
      g.classList.toggle('photo-hidden', !match);
      if (match) {
        const thumbs = $$(SEL.thumbs, g);
        g.classList.toggle('photo-hidden', thumbs.length <= 1); // 單張縮圖可選擇隱藏群組
      }
    });
  }
  function enableThumbClickToMain(root, mainPhotoEl) {
    root.addEventListener('click', (e) => {
      const thumb = e.target.closest(SEL.thumbs);
      if (!thumb) return;
      const src = thumb.getAttribute('src') || thumb.dataset.src || '';
      if (src && mainPhotoEl) mainPhotoEl.src = src;
      const group = thumb.closest(SEL.thumbGroups);
      if (group) {
        $$(SEL.thumbs, group).forEach(t => t.classList.remove('photo-active'));
        thumb.classList.add('photo-active');
      }
    });
  }

  // ===========================
  // 5) 渲染（顏色、尺寸、縮圖、整體）
  // ===========================
  function renderColorButtons(variants) {
    const firstAvailableIdx = Math.max(0, (variants || []).findIndex(v => sumVariantStock(v) > 0));
    return (variants || []).map((v, idx) => {
      const total = sumVariantStock(v);
      const disabled = total <= 0;
      const cls = [
        'color-btn',
        (!disabled && idx === firstAvailableIdx) ? 'color-active' : '',
        disabled ? 'color-disabled' : '',
      ].filter(Boolean).join(' ');
      return `<button class="${cls}" data-color="${v.color}" ${disabled ? 'disabled' : ''}></button>`;
    }).join('');
  }
  function renderSizeButtons(sizes) {
    return (sizes || []).map((s, idx) => {
      const stock = Math.max(0, Number(s.stock) || 0);
      const disabled = stock <= 0;
      const cls = [
        'size-option',
        idx === 0 ? 'size-active' : '',
        disabled ? 'size-disabled' : '',
      ].filter(Boolean).join(' ');
      return `<button class="${cls}" data-size="${s.label}" ${disabled ? 'disabled' : ''}>${s.label}</button>`;
    }).join('');
  }
  function renderThumbGroupsByVariants(variants) {
    return (variants || []).map((v, idx) => `
      <div class="product-thumbnails${idx === 0 ? '' : ' photo-hidden'}" data-color="${v.color}">
        ${(v.thumbnails || []).map(src => `
          <div class="product-thumbnail-container">
            <img src="${src}" alt="" class="product-thumbnail">
          </div>
        `).join('')}
      </div>
    `).join('');
  }
  function renderProductDOM(root, product) {
    const firstVariant = product.variants?.[0] || {};
    const firstImg = firstVariant?.thumbnails?.[0] || PLACEHOLDER_IMG;

    root.innerHTML = `
      <div class="product-pics">
        <div class="main-photo-container">
          <img class="main-photo" src="${firstImg}" alt="">
        </div>
        ${renderThumbGroupsByVariants(product.variants)}
      </div>

      <div class="product-info">
        <h3 class="product-name">${product.title}</h3>
        <span class="product-price">${fmtPrice(product.price)}</span>

        <span class="colors-btn-title">COLOUR</span>
        <div class="colors">${renderColorButtons(product.variants)}</div>

        <span class="size-btn-title">SIZE</span>
        <div class="size-list">${renderSizeButtons(firstVariant.sizes || [])}</div>

        <div class="product-quantity-container">
          <span class="product-quantity-title">QUANTITY</span>
          <div class="quantity-controls">
            <button class="minus-btn"><i class="fa-solid fa-minus"></i></button>
            <input id="product-quantity" class="product-quantity" type="number" value="1" min="1" max="99">
            <button class="plus-btn"><i class="fa-solid fa-plus"></i></button>
          </div>
        </div>

        <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>

        <p class="product-description">${product.description ?? ''}</p>
      </div>
    `;
  }

  // 切顏色時重繪尺寸（含禁用無庫存 + 預設第一個可售為 active）
  function rerenderSizesForColor(root, product, color) {
    const variant = findVariantByColor(product, color);
    const sizeListEl = $(SEL.sizeList, root);
    if (!variant || !sizeListEl) return;
    sizeListEl.innerHTML = renderSizeButtons(variant.sizes || []);
    const firstEnabled = $(`${SEL.sizeOpts}:not([disabled])`, sizeListEl) || $(SEL.sizeOpts, sizeListEl);
    if (firstEnabled) {
      $$(SEL.sizeOpts, sizeListEl).forEach(i => i.classList.remove('size-active'));
      firstEnabled.classList.add('size-active');
    }
  }

  // ===========================
  // 6) 數量控制（輸入與 + / -）
  // ===========================
  function enforceQtyInputRules(input) {
    input.addEventListener('input', () => {
      const digits = input.value.trim().replace(/[^\d]/g, '').slice(0, 2);
      input.value = String(clamp(toInt(digits, QTY_MIN), QTY_MIN, QTY_MAX));
    });
  }
  function bindQtyButtons(root, input) {
    root.addEventListener('click', (e) => {
      if (e.target.closest('.plus-btn')) input.value = String(clamp(toInt(input.value, 1) + 1, 1, Number(input.max) || QTY_MAX));
      if (e.target.closest('.minus-btn')) input.value = String(clamp(toInt(input.value, 1) - 1, 1, Number(input.max) || QTY_MAX));
    });
  }

  // ===========================
  // 7) 初始化主流程
  // ===========================
  async function initProductPage() {
    // 穩定根容器：#app ＞ .product-container
    const app = document.getElementById('app');
    if (!app) { console.error('[init] 找不到 #app'); return; }
    let pageRoot = app.querySelector(SEL.pageRoot);
    if (!pageRoot) { pageRoot = document.createElement('div'); pageRoot.className = 'product-container'; app.innerHTML = ''; app.appendChild(pageRoot); }

    const productId = readProductIdFromHash();
    if (!productId) { pageRoot.innerHTML = '<p style="color:red">缺少商品 id（#product?id=...）</p>'; return; }

    // 取資料
    let product;
    try { product = await fetchProductById(productId); }
    catch (e) { console.error('[init] fetchProductById error:', e); pageRoot.innerHTML = '<h3 style="color: grey;">Server is not running</h3>'; return; }

    // Render
    try {
      pageRoot.dataset.productId = product.id;
      renderProductDOM(pageRoot, product);
    } catch (e) {
      console.error('[init] renderProductDOM error:', e);
      pageRoot.innerHTML = '<p style="color:red">載入商品失敗（Render）</p>';
      return;
    }

    // 綁互動（全部綁在 pageRoot：委派）
    const mainPhoto = $(SEL.mainPhoto, pageRoot);
    const qtyInput = $(SEL.qtyInput, pageRoot);
    const addBtn = $(SEL.addBtn, pageRoot);

    // 顏色 → 切縮圖群、換主圖、重繪尺寸、更新數量上限
    bindSingleSelect(pageRoot, SEL.colorBtns, 'color-active', (btn) => {
      const color = btn.dataset.color;
      toggleThumbGroupsByColor(pageRoot, color);
      const group = $(`${SEL.thumbGroups}[data-color="${color}"]`, pageRoot);
      if (group) setMainPhotoByFirstThumbOfGroup(mainPhoto, group);
      rerenderSizesForColor(pageRoot, product, color);

      const sizeEl = $(`${SEL.sizeOpts}.size-active`, pageRoot);
      const size = sizeEl?.dataset.size || '';
      if (qtyInput && size) setQtyMax(qtyInput, getStock(product, color, size));
    });

    // 尺寸 → 更新數量上限
    bindSingleSelect(pageRoot, SEL.sizeOpts, 'size-active', (btn) => {
      const size = btn.dataset.size;
      const color = $(`${SEL.colorBtns}.color-active`, pageRoot)?.dataset.color;
      if (qtyInput && color && size) setQtyMax(qtyInput, getStock(product, color, size));
    });

    // 首次同步主圖與數量上限
    const activeColor = $(`${SEL.colorBtns}.color-active`, pageRoot)?.dataset.color;
    if (activeColor) {
      toggleThumbGroupsByColor(pageRoot, activeColor);
      const group = $(`${SEL.thumbGroups}[data-color="${activeColor}"]`, pageRoot);
      if (group) setMainPhotoByFirstThumbOfGroup(mainPhoto, group);
    }
    if (qtyInput && activeColor) {
      const activeSize = $(`${SEL.sizeOpts}.size-active`, pageRoot)?.dataset.size;
      if (activeSize) setQtyMax(qtyInput, getStock(product, activeColor, activeSize));
    }

    // 縮圖 → 主圖
    enableThumbClickToMain(pageRoot, mainPhoto);

    // 數量限制
    if (qtyInput) { enforceQtyInputRules(qtyInput); bindQtyButtons(pageRoot, qtyInput); }

    // 加入購物車（含庫存防呆）
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const id = pageRoot.dataset.productId || addBtn.dataset.id;
        if (!id) return console.warn('找不到 productId');

        const color = $(`${SEL.colorBtns}.color-active`, pageRoot)?.dataset.color || '-';
        const size = $(`${SEL.sizeOpts}.size-active`, pageRoot)?.dataset.size || '-';
        const stock = getStock(product, color, size);
        if (stock <= 0) { showToast?.('此款式／尺寸已售完'); return; }

        const qty = clamp(toInt(qtyInput?.value, 1), 1, stock);
        window.addToCartVariant?.(id, { color, size }, qty);   // cart-store 會處理 key 與廣播 cart:updated
        showToast?.('已加入購物車');
        // window.openCart?.(); // 想加入後自動打開購物車可打開這行
      });
    }
  }

  // 交給 main.js 呼叫
  window.initProductPage = initProductPage;
})();
