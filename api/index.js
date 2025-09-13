const app = require('../server/app')

module.exports = (req, res) => {
  console.log('[api/index] incoming:', req.method, req.url);
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
    console.log('[api/index] rewrote to:', req.url);
  }
  return app(req, res);
};