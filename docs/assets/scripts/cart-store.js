function makeKey(id, { color = '-', size = '-' } = {}) {
  return `${id}__c:${String(color) || '-'}__s:${String(size) || '-'}`;
}
function parseKey(key = '') {
  const [id, rest = ''] = String(key).split('__c:');
  const [colorPart = '-', sizePart = '-'] = rest.split('__s:');
  return { id, color: colorPart || '-', size: sizePart || '-' };
}

const CART_STORAGE_KEY = 'app:cart:v1';

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
            const k = makeKey(it.id, {});
            obj[k] = { id: it.id, qty: Number(it.qty) || 0, color: '-', size: '-' };
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

  setQtyByKey(key, qty) {
    const n = Number(qty) || 0;
    const { id, color, size } = parseKey(key);
    if (n <= 0) { delete this._data[key]; this.save(); }
    else { this._data[key] = { id, color, size, qty: n }; this.save(); }
  },
  incByKey(key, delta = 1) {
    const cur = this._data[key]?.qty || 0;
    this.setQtyByKey(key, cur + Number(delta || 0));
  },
  removeByKey(key) { if (this._data[key]) { delete this._data[key]; this.save(); } },

  setQty(id, qty) { this.setQtyByKey(makeKey(id, {}), qty); },
  inc(id, delta = 1) { this.incByKey(makeKey(id, {}), delta); },
  remove(id) { this.removeByKey(makeKey(id, {})); },

  clear() { this._data = {}; this.save(); },

  count() { return Object.values(this._data).reduce((s, i) => s + (i.qty || 0), 0); },
  distinct() { return Object.keys(this._data).length; },

  entries() {
    return Object.entries(this._data).map(([key, v]) => ({
      key, id: v.id, color: v.color || '-', size: v.size || '-', qty: v.qty || 0
    }));
  },

  makeKey, parseKey
};

cartStore.load();

window.cartStore = cartStore;
window.addToCartVariant = (id, opts = {}, qty = 1) => cartStore.incByKey(makeKey(id, opts), qty);
window.addToCart = (id, qty = 1) => cartStore.inc(id, qty);
window.setCartQty = (id, qty) => cartStore.setQty(id, qty);
window.removeFromCart = (id) => cartStore.remove(id);
window.clearCart = () => cartStore.clear();
window.getCartCount = () => cartStore.count();