const CART_STORAGE_KEY = 'app:cart:v1'

const cartStore = {
  _data: {},
  load() {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        // 正常情況：是一個物件，直接使用
        this._data = parsed;
      } else if (Array.isArray(parsed)) {
        // 如果不小心存成陣列，就轉換成 { id: {id, qty} } 格式
        const obj = {};
        for (const it of parsed) {
          if (it && typeof it === 'object' && typeof it.id === 'string') {
            obj[it.id] = { id: it.id, qty: Number(it.qty) || 0 };
          }
        }
        this._data = obj;
      } else {
        // 如果格式錯誤，就清空
        this._data = {};
      }
    } catch {
      // JSON.parse 失敗的保底
      this._data = {};
    }
  },
  save() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this._data))
    window.dispatchEvent(new CustomEvent('cart:updated'), { detail: { count: this.count() } })
  },
  setQty(id, qty) {
    if (qty <= 0) {
      delete this._data[id]
    } else {
      this._data[id] = { id, qty: Number(qty) || 0 }
      this.save()
    }
  },
  inc(id, delta = 1) {
    const cur = this._data[id]?.qty || 0
    this.setQty(id, cur + Number(delta || 0))
  },
  remove(id) {
    if (this._data[id]) {
      delete this._data[id]
      this.save()
    }
  },
  clear() {
    this._data = {}
    this.save()
  },
  count() {
    return Object.values(this._data).reduce((s, i) => s + (i.qty || 0), 0)
  },
  distinct() {
    return Object.keys(this._data).length
  }
}

cartStore.load()

// ---- 對外 API（任何頁面腳本可用） ----
window.addToCart = (id, qty = 1) => cartStore.inc(id, qty);
window.setCartQty = (id, qty) => cartStore.setQty(id, qty);
window.removeFromCart = (id) => cartStore.remove(id);
window.clearCart = () => cartStore.clear();
window.getCartCount = () => cartStore.count();

// badge渲染
function formatCount(n) {
  n = Number(n) || 0
  return n > 99 ? "99+" : String(n)
}

function getBadgeEl() {
  return document.getElementById('cartBadge')
}

function renderCartBadge(count) {
  const el = getBadgeEl()
  if(!el) return

  const c = Number(count) || 0
  if(c > 0) {
    el.textContent = formatCount(c)
    el.classList.add('show')
  }else {
    el.textContent = ''
    el.classList.remove('show')
  }
}

// 初次渲染
renderCartBadge(cartStore.count())

window.addEventListener('cart:updated', (e) => {
  renderCartBadge(e.detail?.count ?? cartStore.count())
})

window.addEventListener('hashchange', () => {
  renderCartBadge(cartStore.count())
})

document.addEventListener('DOMContentLoaded', () => {
  renderCartBadge(cartStore.count());
})