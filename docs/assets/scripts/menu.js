const menuToggle = document.getElementById('menu-toggle');
const overlayMenu = document.getElementById('overlay-menu');
const closeBtn = document.getElementById('close-btn');
const shopToggle = document.getElementById('shop-toggle');
const shopItems = document.querySelector('.shop-items');
const submenu = document.querySelector('.submenu');

function closeAllMenus() {
  overlayMenu?.classList.remove('open');
  menuToggle?.classList.remove('open');
  if (submenu) {
    submenu.classList.remove('open');
    submenu.style.maxHeight = '0px';
  }
}
function toggleOverlay() {
  if (!menuToggle || !overlayMenu) return;
  const rect = menuToggle.getBoundingClientRect();
  overlayMenu.style.setProperty('--menuTop', `${rect.top}px`);
  overlayMenu.style.setProperty('--menuLeft', `${rect.left}px`);
  overlayMenu.classList.toggle('open');
  menuToggle.classList.toggle('open');
}
function toggleSubmenu() {
  if (!submenu) return;
  const opened = submenu.classList.toggle('open');
  submenu.style.maxHeight = opened ? `${submenu.scrollHeight}px` : '0px';
}

window.addEventListener('pageshow', closeAllMenus);
menuToggle?.addEventListener('click', toggleOverlay);
closeBtn?.addEventListener('click', closeAllMenus);
shopToggle?.addEventListener('click', toggleSubmenu);
overlayMenu?.addEventListener('click', (e) => { if (e.target.closest('a')) closeAllMenus(); });

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
    if (shopItems) shopItems.innerHTML = '';
  }
}

window.addEventListener('DOMContentLoaded', initShopMenuItems)
window.addEventListener('pageshow', initShopMenuItems)