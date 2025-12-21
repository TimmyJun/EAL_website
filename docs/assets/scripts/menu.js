const menuToggleBtn = document.getElementById('menu-toggle');
const overlayMenu = document.getElementById('overlay-menu');
const closeBtn = document.getElementById('close-btn');
const shopItems = document.querySelector('.shop-items');
const menuBackdrop = document.getElementById('menuBackdrop');

function setOverlayPositionFrom(el) {
  if (!overlayMenu || !el) return;
  const rect = el.getBoundingClientRect();
  overlayMenu.style.setProperty('--menuTop', `${rect.top}px`);
  overlayMenu.style.setProperty('--menuLeft', `${rect.left}px`);
}

function closeAllMenus() {
  overlayMenu?.classList.remove('open')
  menuToggleBtn?.classList.remove('open')
  menuBackdrop?.classList.remove('is-active')

  document.querySelectorAll('.submenu.open').forEach((ul) => {
    ul.classList.remove('open');
    ul.style.maxHeight = '0px';
  });
}

function openOverlay() {
  if (!menuToggleBtn || !overlayMenu) return
  setOverlayPositionFrom(menuToggleBtn)
  overlayMenu.classList.add('open')
  menuToggleBtn.classList.add('open')
  menuBackdrop?.classList.add('is-active')
}

function toggleOverlay() {
  if (!overlayMenu?.classList.contains('open')) openOverlay();
  else closeAllMenus();
}

/**
 * Toggle a submenu under a toggle element.
 * Expected DOM structure:
 * <div class="menu-toggle-item">...</div>
 * <ul class="submenu">...</ul>
 */
function toggleSubmenu(toggleEl, { closeOthers = true } = {}) {
  const submenu = toggleEl?.nextElementSibling;
  if (!submenu || !submenu.classList.contains('submenu')) return;

  // Optional: accordion behavior (only one open at a time)
  if (closeOthers) {
    document.querySelectorAll('.submenu.open').forEach((ul) => {
      if (ul !== submenu) {
        ul.classList.remove('open');
        ul.style.maxHeight = '0px';
      }
    });
  }

  const opened = submenu.classList.toggle('open');
  submenu.style.maxHeight = opened ? `${submenu.scrollHeight}px` : '0px';
}

function renderShopItems(tags = []) {
  if (!shopItems) return;

  shopItems.innerHTML = '';
  for (const t of tags) {
    const year = t.year;
    const type = String(t.season).toLowerCase();
    const label = t.label;

    const li = document.createElement('li');
    li.className = 'shop-item';

    const a = document.createElement('a');
    a.href = `#products?year=${encodeURIComponent(year)}&type=${encodeURIComponent(type)}&label=${encodeURIComponent(label)}`;
    a.textContent = label;

    li.appendChild(a);
    shopItems.appendChild(li);
  }
}

async function initShopMenuItems() {
  try {
    if (!window.productService?.fetchSeasonTags) return;
    const tags = await window.productService.fetchSeasonTags();
    renderShopItems(tags);
  } catch (err) {
    console.error('[shop-items] load error:', err);
    shopItems && (shopItems.innerHTML = '');
  }
}

// ---------- Events ----------
window.addEventListener('pageshow', closeAllMenus);
window.addEventListener('DOMContentLoaded', initShopMenuItems);
window.addEventListener('pageshow', initShopMenuItems);

menuToggleBtn?.addEventListener('click', toggleOverlay);
closeBtn?.addEventListener('click', closeAllMenus);

// One listener for everything inside the overlay menu
overlayMenu?.addEventListener('click', (e) => {
  const toggleEl = e.target.closest('.menu-toggle-item');
  if (toggleEl) {
    toggleSubmenu(toggleEl, { closeOthers: true });
    return;
  }

  // Clicked a link -> close overlay
  if (e.target.closest('a')) {
    closeAllMenus();
  }
});