// api/products/__whoami.js
module.exports = (req, res) => {
  res.status(200).json({ method: req.method, url: req.url, originalUrl: req.originalUrl });
};


