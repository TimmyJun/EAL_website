(() => {
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

  function bindSingleSelect(root, selector, activeClass, onChange) {
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
        g.classList.toggle('photo-hidden', thumbs.length <= 1);
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
      return `
      <button class="${cls}"
              data-color="${v.color}"
              data-color-code="${v.colorCode || ''}"
              style="background-color:${v.colorCode || '#dcdcdc'}"
              ${disabled ? 'disabled' : ''}>
      </button>
    `;
    }).join('');
  }

  function renderSizeButtons(sizes) {
    // 先找出第一個有庫存的 index
    let firstEnabledIdx = -1;
    (sizes || []).forEach((s, idx) => {
      const stock = Math.max(0, Number(s.stock) || 0);
      if (stock > 0 && firstEnabledIdx === -1) {
        firstEnabledIdx = idx;
      }
    });

    return (sizes || []).map((s, idx) => {
      const stock = Math.max(0, Number(s.stock) || 0);
      const disabled = stock <= 0;
      const cls = [
        'size-option',
        // ✅ 只有第一個有庫存的才預設 active
        idx === firstEnabledIdx ? 'size-active' : '',
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

  async function initProductPage() {
    const app = document.getElementById('app');
    if (!app) { console.error('[init] 找不到 #app'); return; }
    let pageRoot = app.querySelector(SEL.pageRoot);
    if (!pageRoot) { pageRoot = document.createElement('div'); pageRoot.className = 'product-container'; app.innerHTML = ''; app.appendChild(pageRoot); }

    const productId = readProductIdFromHash();
    if (!productId) { pageRoot.innerHTML = '<p style="color:red">缺少商品 id（#product?id=...）</p>'; return; }

    let product;
    try { product = await fetchProductById(productId); }
    catch (e) { console.error('[init] fetchProductById error:', e); pageRoot.innerHTML = '<h3 style="color: grey;">Server is not running</h3>'; return; }

    try {
      pageRoot.dataset.productId = product.id;
      renderProductDOM(pageRoot, product);
    } catch (e) {
      console.error('[init] renderProductDOM error:', e);
      pageRoot.innerHTML = '<p style="color:red">載入商品失敗（Render）</p>';
      return;
    }

    const mainPhoto = $(SEL.mainPhoto, pageRoot);
    const qtyInput = $(SEL.qtyInput, pageRoot);
    const addBtn = $(SEL.addBtn, pageRoot);

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

    bindSingleSelect(pageRoot, SEL.sizeOpts, 'size-active', (btn) => {
      const size = btn.dataset.size;
      const color = $(`${SEL.colorBtns}.color-active`, pageRoot)?.dataset.color;
      if (qtyInput && color && size) setQtyMax(qtyInput, getStock(product, color, size));
    });

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

    enableThumbClickToMain(pageRoot, mainPhoto);

    if (qtyInput) { enforceQtyInputRules(qtyInput); bindQtyButtons(pageRoot, qtyInput); }

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const id = pageRoot.dataset.productId || addBtn.dataset.id;
        if (!id) return console.warn('找不到 productId');

        const color = $(`${SEL.colorBtns}.color-active`, pageRoot)?.dataset.color || '-';
        const size = $(`${SEL.sizeOpts}.size-active`, pageRoot)?.dataset.size || '-';
        const stock = getStock(product, color, size);
        if (stock <= 0) { showToast?.('此款式／尺寸已售完'); return; }

        const qty = clamp(toInt(qtyInput?.value, 1), 1, stock);
        window.addToCartVariant?.(id, { color, size }, qty);
        showToast?.('已加入購物車');
      });
    }
  }

  window.initProductPage = initProductPage;
})()