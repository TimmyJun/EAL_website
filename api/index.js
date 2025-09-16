// api/index.js - Single entry for all /api/* requests
const app = require('../server/app');

module.exports = (req, res) => {
  // 保留原始路徑，不改寫 req.url
  return app(req, res);
};


