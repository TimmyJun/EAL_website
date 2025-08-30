const CART_STORAGE_KEY = 'app:cart:v1'

const cartStore = {
  _data: {},
  load() {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        this._data = parsed;
      } else if (Array.isArray(parsed)) {
        const obj = {};
        for (const it of parsed) {
          if (it && typeof it === 'object' && typeof it.id === 'string') {
            obj[it.id] = { id: it.id, qty: Number(it.qty) || 0 };
          }
        }
        this._data = obj;
      } else {
        this._data = {};
      }
    } catch { this._data = {}; }
  },
  save() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this._data));
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: this.count() } }));
  },
  setQty(id, qty) {
    const n = Number(qty) || 0;
    if (n <= 0) { delete this._data[id]; this.save(); }
    else { this._data[id] = { id, qty: n }; this.save(); }
  },
  inc(id, delta = 1) {
    const cur = this._data[id]?.qty || 0;
    this.setQty(id, cur + Number(delta || 0));
  },
  remove(id) { if (this._data[id]) { delete this._data[id]; this.save(); } },
  clear() { this._data = {}; this.save(); },
  count() { return Object.values(this._data).reduce((s, i) => s + (i.qty || 0), 0); },
  distinct() { return Object.keys(this._data).length; },
  entries() { return Object.values(this._data).map(({ id, qty }) => ({ id, qty })); }
};

cartStore.load();

// 對外 API（維持你的命名）
window.cartStore = cartStore;
window.addToCart = (id, qty = 1) => cartStore.inc(id, qty);
window.setCartQty = (id, qty) => cartStore.setQty(id, qty);
window.removeFromCart = (id) => cartStore.remove(id);
window.clearCart = () => cartStore.clear();
window.getCartCount = () => cartStore.count();