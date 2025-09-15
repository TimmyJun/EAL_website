// api/products/[...all].js
const app = require('../../server/app');

module.exports = (req, res) => {
  // 確保進到 Express 時仍保有 /api 前綴與 /api/products 掛載點
  if (!req.url.startsWith('/api/products')) {
    if (req.url.startsWith('/api')) {
      // /api/xxx -> /api/products/xxx (理論上不會發生在此 handler，但保險)
      req.url = req.url.replace(/^\/api/, '/api/products');
    } else {
      // /xxx -> /api/products/xxx
      req.url = '/api/products' + (req.url.startsWith('/') ? '' : '/') + req.url;
    }
  }
  return app(req, res);
};


