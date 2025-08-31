(() => {
  const QTY_MIN = 1;
  const QTY_MAX = 99;
  const SEL = {
    mainPhoto: '.main-photo',
    colorBtns: '.color-btn',
    sizeOpts: '.size-option',
    thumbGroups: '.product-thumbnails',
    thumbs: '.product-thumbnail',
    qtyInput: '#product-quantity',
    addBtn: '.add-to-cart',
    pageRoot: '.product-container'
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const toInt = (v, def = 0) => {
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? def : n;
  };
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  // 單選類型按鈕：套 active class、回呼選中的元素
  function bindSingleSelect(root, selector, activeClass, onChange) {
    const items = $$(selector, root);
    if (!items.length) return;

    // 預設第一個 active（或保留原本 active）
    if (!items.some(el => el.classList.contains(activeClass))) {
      items[0].classList.add(activeClass);
    }

    items.forEach(el => {
      el.addEventListener('click', () => {
        items.forEach(i => i.classList.remove(activeClass));
        el.classList.add(activeClass);
        onChange?.(el);
      });
    });
  }

  // ===== 畫面行為（純函式與小控制器） =====
  function setMainPhotoByFirstThumbOfGroup(mainPhotoEl, groupEl) {
    const firstThumb = $(SEL.thumbs, groupEl);
    if (firstThumb && mainPhotoEl) {
      mainPhotoEl.src = firstThumb.getAttribute('src') || firstThumb.dataset.src || '';
    }
  }

  function toggleThumbGroupsByColor(root, color) {
    const groups = $$(SEL.thumbGroups, root);
    groups.forEach(g => {
      const match = g.dataset.color === color;
      g.classList.toggle('photo-hidden', !match);

      if (match) {
        // 若只有 1 張縮圖，可直接隱藏該區塊（依需求）
        const thumbs = $$(SEL.thumbs, g);
        g.classList.toggle('photo-hidden', thumbs.length <= 1);
      }
    });
  }

  function enableThumbClickToMain(root, mainPhotoEl) {
    // 事件委派：點任何縮圖，換主圖
    root.addEventListener('click', (e) => {
      const thumb = e.target.closest(SEL.thumbs);
      if (!thumb) return;
      const src = thumb.getAttribute('src') || thumb.dataset.src || '';
      if (src && mainPhotoEl) mainPhotoEl.src = src;

      // 同群組的 active 樣式
      const group = thumb.closest(SEL.thumbGroups);
      if (group) {
        $$(SEL.thumbs, group).forEach(t => t.classList.remove('photo-active'));
        thumb.classList.add('photo-active');
      }
    });
  }

  function enforceQtyInputRules(input) {
    input.addEventListener('input', () => {
      const raw = input.value.trim();
      // 只保留數字
      const digits = raw.replace(/[^\d]/g, '').slice(0, 2); // 最多兩位
      let val = toInt(digits, QTY_MIN);
      val = clamp(val, QTY_MIN, QTY_MAX);
      input.value = String(val);
    });
  }

  function bindQtyButtons(root, input) {
    root.addEventListener('click', (e) => {
      if (e.target.closest('.plus-btn')) {
        const v = clamp(toInt(input.value, QTY_MIN) + 1, QTY_MIN, QTY_MAX);
        input.value = String(v);
      }
      if (e.target.closest('.minus-btn')) {
        const v = clamp(toInt(input.value, QTY_MIN) - 1, QTY_MIN, QTY_MAX);
        input.value = String(v);
      }
    });
  }

  // 取得商品 id（優先按鈕 data-id，其次頁面根 data-product-id）
  function getProductId(root) {
    const btn = $(SEL.addBtn, root);
    return btn?.dataset.id || root?.dataset.productId || '';
  }

  function getQty(input) {
    return clamp(toInt(input?.value, QTY_MIN), QTY_MIN, QTY_MAX);
  }

  function getActiveVariant(root) {
    const colorEl = root.querySelector('.color-btn.color-active');
    const sizeEl = root.querySelector('.size-option.size-active');
    const color = colorEl?.dataset.color || colorEl?.textContent?.trim() || '-';
    const size = sizeEl?.dataset.size || sizeEl?.textContent?.trim() || '-';
    return { color, size };
  }

  // ===== 主流程 =====
  function initProductPage() {
    const pageRoot = $(SEL.pageRoot) || document; // 允許沒加 .product-page 也能跑
    const mainPhoto = $(SEL.mainPhoto, pageRoot);
    const qtyInput = $(SEL.qtyInput, pageRoot);
    const addBtn = $(SEL.addBtn, pageRoot);

    // 1) 顏色單選：切換縮圖群組 + 主圖
    bindSingleSelect(pageRoot, SEL.colorBtns, 'color-active', (btn) => {
      const color = btn.dataset.color;
      toggleThumbGroupsByColor(pageRoot, color);

      // 顯示對應群組的第一張為主圖
      const group = $(`${SEL.thumbGroups}[data-color="${color}"]`, pageRoot);
      if (group) setMainPhotoByFirstThumbOfGroup(mainPhoto, group);
    });

    // 初次載入：若有預設 color-active，依它初始化；否則用第一顆 color-btn
    const activeColorBtn = $(`${SEL.colorBtns}.color-active`, pageRoot) || $(SEL.colorBtns, pageRoot);
    if (activeColorBtn) {
      const color = activeColorBtn.dataset.color;
      toggleThumbGroupsByColor(pageRoot, color);
      const group = $(`${SEL.thumbGroups}[data-color="${color}"]`, pageRoot);
      if (group) setMainPhotoByFirstThumbOfGroup(mainPhoto, group);
    }

    // 2) 縮圖點擊 -> 主圖（事件委派）
    enableThumbClickToMain(pageRoot, mainPhoto);

    // 3) 尺寸單選
    bindSingleSelect(pageRoot, SEL.sizeOpts, 'size-active');

    // 4) 數量欄位規則 + 加減按鈕
    if (qtyInput) {
      enforceQtyInputRules(qtyInput);
      bindQtyButtons(pageRoot, qtyInput);
    }

    // 5) 加入購物車
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const id = getProductId(pageRoot);
        const qty = getQty(qtyInput);
        if (!id) {
          console.warn('找不到 productId，請在 .add-to-cart 加 data-id 或在頁面根節點加 data-product-id');
          return;
        }
        const variant = getActiveVariant(pageRoot);
        // ✅ 改用含變體的 API
        window.addToCartVariant?.(id, variant, qty);
        showToast?.('已加入購物車');
      });
    }
  }

  // 交給router 呼叫
  window.initProductPage = initProductPage;
})();
