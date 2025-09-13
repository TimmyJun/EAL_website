const productModel = require('../models/productModel');

// GET /api/products?year=2025&type=ss
exports.list = async (req, res) => {
  try {
    const { year, type } = req.query;
    const items = await productModel.listProducts({ year, type });
    res.json(items);
  } catch (e) {
    console.error('[list error]', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/products/:id
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await productModel.getProductById(id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (e) {
    console.error('[getOne error]', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/products/collections/season-tags
exports.seasonTags = async (req, res) => {
  try {
    const rows = await productModel.getSeasonTags();
    const payload = rows.map(r => ({
      year: r.year,
      season: r.season,                        // 'SS' | 'FW'
      label: `${String(r.year).slice(2)}${r.season}`, // 2025+SS -> 25SS
    }));
    res.json(payload);
  } catch (e) {
    console.error('[seasonTags error]', e);
    res.status(500).json({ message: 'Server error' });
  }
}