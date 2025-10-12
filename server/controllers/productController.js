const productModel = require('../models/productModel');

// GET /api/products?year=2025&type=ss
exports.list = async (req, res) => {
  try {
    const { year, type } = req.query;
    const items = await productModel.listProducts({ year, type });
    res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
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
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
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
    res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    res.json(payload);
  } catch (e) {
    console.error('[seasonTags error]', e);
    res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/products/stock/check
exports.checkStock = async (req, res) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const issues = [];

    for (const it of items) {
      const p = await productModel.getProductById(it.id);
      if (!p) {
        issues.push({
          id: it.id,
          color: it.color,
          size: it.size,
          want: it.qty,
          available: 0,
          reason: 'NOT_FOUND',
        });
        continue;
      }

      const variant = (p.variants || []).find(v => v.color === it.color);
      const sizeRow = variant?.sizes?.find(s => s.label === it.size);
      const available = Math.max(0, Number(sizeRow?.stock || 0));

      if (available < it.qty) {
        issues.push({
          id: it.id,
          title: p.title,
          color: it.color,
          size: it.size,
          want: it.qty,
          available,
          reason: 'INSUFFICIENT',
        });
      }
    }

    if (issues.length) {
      return res.status(200).json({ ok: false, issues });
    }
    return res.json({ ok: true });
  } catch (e) {
    console.error('[checkStock error]', e);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
};