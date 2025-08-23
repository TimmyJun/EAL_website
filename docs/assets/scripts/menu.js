const menuToggle = document.getElementById('menu-toggle');
const overlayMenu = document.getElementById('overlay-menu');
const closeBtn = document.getElementById('close-btn');
const shopToggle = document.getElementById('shop-toggle');
const shopItems = document.querySelector('.shop-items');
const menuLinks = document.querySelectorAll('.overlay-menu a')
const submenu = document.querySelector('.submenu');

window.addEventListener('pageshow', () => {
  // 關閉主選單
  overlayMenu.classList.remove('open');
  menuToggle.classList.remove('open');

  // 關閉子選單
  submenu.classList.remove('open');
  submenu.style.maxHeight = '0px';
});

menuToggle.addEventListener('click', () => {
  const rect = menuToggle.getBoundingClientRect()
  overlayMenu.style.setProperty('--menuTop', `${rect.top}px`)
  overlayMenu.style.setProperty('--menuLeft', `${rect.left}px`)
  overlayMenu.classList.toggle('open')
  menuToggle.classList.toggle('open')
});

closeBtn.addEventListener('click', () => {
  overlayMenu.classList.remove('open');
})

shopToggle.addEventListener('click', () => {
  const isOpen = submenu.classList.toggle('open');
  if (isOpen) {
    submenu.style.maxHeight = submenu.scrollHeight + "px";
  } else {
    submenu.style.maxHeight = "0px";
  }
})

// 只要點擊任何一個連結，就自動收合選單
document.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    overlayMenu.classList.remove('open');
    menuToggle.classList.remove('open');
    submenu.classList.remove('open');
    submenu.style.maxHeight = '0px';
  });
});
