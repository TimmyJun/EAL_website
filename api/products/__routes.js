// api/products/__routes.js
const app = require('../../server/app');

module.exports = (req, res) => {
  req.url = '/api/products/__routes';
  return app(req, res);
};


