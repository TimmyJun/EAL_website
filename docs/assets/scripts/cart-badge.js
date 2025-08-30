function formatCount(n) { n = Number(n) || 0; return n > 99 ? '99+' : String(n); }
function getBadgeEl() { return document.getElementById('cartBadge'); }
function renderCartBadge(count) {
  const el = getBadgeEl(); if (!el) return;
  const c = Number(count) || 0;
  if (c > 0) { el.textContent = formatCount(c); el.classList.add('show'); }
  else { el.textContent = ''; el.classList.remove('show'); }
}

// 初次渲染與事件
document.addEventListener('DOMContentLoaded', () => renderCartBadge(window.getCartCount?.() ?? 0));
window.addEventListener('hashchange', () => renderCartBadge(window.getCartCount?.() ?? 0));
window.addEventListener('cart:updated', (e) => {
  renderCartBadge(e.detail?.count ?? window.getCartCount?.() ?? 0);
})