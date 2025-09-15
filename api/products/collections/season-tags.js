// api/products/collections/season-tags.js
const app = require('../../../server/app');

module.exports = (req, res) => {
  // 強制明確轉發到 Express 內同一路徑
  req.url = '/api/products/collections/season-tags' + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
  return app(req, res);
};


