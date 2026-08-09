// admin/routes/adminRoutes.js
// 後台 API（掛在 /admin/api 之下）。直接使用 Prisma 操作 DB，
// 圖片以 base64 傳入後由後端直傳 S3（本機單人使用，無 serverless body 限制）。
const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const s3 = require('../lib/s3');

const SEASONS = ['SS', 'FW', 'AW'];

// 統一的 include，讓回傳結構一致
const PRODUCT_INCLUDE = { variants: { include: { sizes: true } } };

// 小工具：把 sizes 依 label 數字排序（與前台 productModel 行為一致）
function sortProduct(p) {
  if (!p || !Array.isArray(p.variants)) return p;
  return {
    ...p,
    variants: p.variants.map(v => ({
      ...v,
      sizes: Array.isArray(v.sizes)
        ? [...v.sizes].sort((a, b) => Number(a.label) - Number(b.label))
        : [],
    })),
  };
}

function asInt(v, fallback = 0) {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

// base64 / dataURL -> Buffer
function bufferFromBase64(data) {
  if (typeof data !== 'string') throw new Error('圖片資料格式錯誤');
  const comma = data.indexOf(',');
  const raw = data.startsWith('data:') && comma !== -1 ? data.slice(comma + 1) : data;
  return Buffer.from(raw, 'base64');
}

// wrap async handler 錯誤
const wrap = fn => (req, res) => fn(req, res).catch(err => {
  console.error('[admin api error]', err);
  res.status(500).json({ ok: false, message: err.message });
});

// --- 環境資訊（前端用來顯示 staging/prod 橫幅）---
router.get('/meta', (_req, res) => {
  res.json({
    ok: true,
    env: process.env.ADMIN_ENV || 'staging',
    appEnv: process.env.APP_ENV || null,
    bucket: s3.BUCKET || null,
    region: s3.REGION || null,
    publicBase: s3.PUBLIC_BASE || null,
  });
});

// --- 商品列表（含已封存）---
router.get('/products', wrap(async (_req, res) => {
  const rows = await prisma.product.findMany({
    orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    include: PRODUCT_INCLUDE,
  });
  res.json({ ok: true, items: rows.map(sortProduct) });
}));

// --- 單一商品 ---
router.get('/products/:id', wrap(async (req, res) => {
  const p = await prisma.product.findUnique({ where: { id: req.params.id }, include: PRODUCT_INCLUDE });
  if (!p) return res.status(404).json({ ok: false, message: '找不到商品' });
  res.json({ ok: true, item: sortProduct(p) });
}));

// --- 新增商品（可含 variants / sizes；thumbnails 之後再上傳）---
router.post('/products', wrap(async (req, res) => {
  const b = req.body || {};
  if (!b.title || !String(b.title).trim()) return res.status(400).json({ ok: false, message: 'title 必填' });
  if (!SEASONS.includes(b.season)) return res.status(400).json({ ok: false, message: `season 必須為 ${SEASONS.join(' / ')}` });

  const variantsToCreate = (Array.isArray(b.variants) ? b.variants : []).map(v => ({
    color: String(v.color || '').trim(),
    colorCode: v.colorCode ? String(v.colorCode).trim() : null,
    thumbnails: Array.isArray(v.thumbnails) ? v.thumbnails : [],
    sizes: { create: (Array.isArray(v.sizes) ? v.sizes : []).map(s => ({ label: String(s.label), stock: asInt(s.stock, 0) })) },
  }));

  const created = await prisma.product.create({
    data: {
      title: String(b.title).trim(),
      price: asInt(b.price, 0),
      year: asInt(b.year, new Date().getFullYear()),
      season: b.season,
      description: b.description != null ? String(b.description) : null,
      isArchived: !!b.isArchived,
      isWomens: !!b.isWomens,
      variants: { create: variantsToCreate },
    },
    include: PRODUCT_INCLUDE,
  });
  res.json({ ok: true, item: sortProduct(created) });
}));

// --- 更新商品欄位 ---
router.put('/products/:id', wrap(async (req, res) => {
  const b = req.body || {};
  const data = {};
  if (b.title != null) data.title = String(b.title).trim();
  if (b.price != null) data.price = asInt(b.price, 0);
  if (b.year != null) data.year = asInt(b.year, new Date().getFullYear());
  if (b.season != null) {
    if (!SEASONS.includes(b.season)) return res.status(400).json({ ok: false, message: `season 必須為 ${SEASONS.join(' / ')}` });
    data.season = b.season;
  }
  if (b.description !== undefined) data.description = b.description != null ? String(b.description) : null;
  if (b.isArchived != null) data.isArchived = !!b.isArchived;
  if (b.isWomens != null) data.isWomens = !!b.isWomens;

  const updated = await prisma.product.update({ where: { id: req.params.id }, data, include: PRODUCT_INCLUDE });
  res.json({ ok: true, item: sortProduct(updated) });
}));

// --- 刪除商品（連同 variants / sizes / S3 圖片）---
router.delete('/products/:id', wrap(async (req, res) => {
  const p = await prisma.product.findUnique({ where: { id: req.params.id }, include: { variants: true } });
  if (!p) return res.status(404).json({ ok: false, message: '找不到商品' });

  const allUrls = p.variants.flatMap(v => v.thumbnails || []);
  await prisma.size.deleteMany({ where: { variant: { productId: p.id } } });
  await prisma.variant.deleteMany({ where: { productId: p.id } });
  await prisma.product.delete({ where: { id: p.id } });

  // DB 成功後才刪 S3（失敗不中斷）
  let deleted = 0;
  for (const url of allUrls) {
    try { if (await s3.deleteByUrl(url)) deleted++; } catch (e) { console.warn('[s3 delete fail]', url, e.message); }
  }
  res.json({ ok: true, deletedImages: deleted });
}));

// --- 新增 variant ---
router.post('/products/:id/variants', wrap(async (req, res) => {
  const b = req.body || {};
  const v = await prisma.variant.create({
    data: {
      productId: req.params.id,
      color: String(b.color || '').trim(),
      colorCode: b.colorCode ? String(b.colorCode).trim() : null,
      thumbnails: Array.isArray(b.thumbnails) ? b.thumbnails : [],
      sizes: { create: (Array.isArray(b.sizes) ? b.sizes : []).map(s => ({ label: String(s.label), stock: asInt(s.stock, 0) })) },
    },
    include: { sizes: true },
  });
  res.json({ ok: true, item: v });
}));

// --- 更新 variant（顏色 / 色碼）---
router.put('/variants/:vid', wrap(async (req, res) => {
  const b = req.body || {};
  const data = {};
  if (b.color != null) data.color = String(b.color).trim();
  if (b.colorCode !== undefined) data.colorCode = b.colorCode ? String(b.colorCode).trim() : null;
  const v = await prisma.variant.update({ where: { id: req.params.vid }, data, include: { sizes: true } });
  res.json({ ok: true, item: v });
}));

// --- 刪除 variant（連同 sizes / S3 圖片）---
router.delete('/variants/:vid', wrap(async (req, res) => {
  const v = await prisma.variant.findUnique({ where: { id: req.params.vid } });
  if (!v) return res.status(404).json({ ok: false, message: '找不到 variant' });
  await prisma.size.deleteMany({ where: { variantId: v.id } });
  await prisma.variant.delete({ where: { id: v.id } });
  let deleted = 0;
  for (const url of (v.thumbnails || [])) {
    try { if (await s3.deleteByUrl(url)) deleted++; } catch (e) { console.warn('[s3 delete fail]', url, e.message); }
  }
  res.json({ ok: true, deletedImages: deleted });
}));

// --- 重新排序 thumbnails（核心：整組取代為前端給的順序）---
router.put('/variants/:vid/thumbnails', wrap(async (req, res) => {
  const b = req.body || {};
  if (!Array.isArray(b.thumbnails)) return res.status(400).json({ ok: false, message: 'thumbnails 必須是陣列' });

  const current = await prisma.variant.findUnique({ where: { id: req.params.vid } });
  if (!current) return res.status(404).json({ ok: false, message: '找不到 variant' });

  // 安全檢查：新順序必須是現有網址的排列（不新增、不遺漏），避免誤存到錯誤資料
  const before = [...(current.thumbnails || [])].sort();
  const after = [...b.thumbnails].sort();
  const sameSet = before.length === after.length && before.every((u, i) => u === after[i]);
  if (!sameSet) {
    return res.status(409).json({ ok: false, message: '排序清單與現有圖片不一致（可能其他地方已變更），請重新整理後再試。' });
  }

  const v = await prisma.variant.update({ where: { id: req.params.vid }, data: { thumbnails: b.thumbnails } });
  res.json({ ok: true, item: v });
}));

// --- 上傳圖片（base64）到 S3，附加到 thumbnails 末端 ---
router.post('/variants/:vid/images', wrap(async (req, res) => {
  const images = Array.isArray(req.body?.images) ? req.body.images : [];
  if (!images.length) return res.status(400).json({ ok: false, message: '沒有收到圖片' });

  const variant = await prisma.variant.findUnique({ where: { id: req.params.vid }, include: { product: true } });
  if (!variant) return res.status(404).json({ ok: false, message: '找不到 variant' });

  const uploaded = [];
  for (const img of images) {
    const buf = bufferFromBase64(img.dataBase64 || img.data);
    const { url } = await s3.uploadBuffer(buf, img.name, { title: variant.product.title, color: variant.color });
    uploaded.push(url);
  }

  const newThumbnails = [...(variant.thumbnails || []), ...uploaded];
  const v = await prisma.variant.update({ where: { id: variant.id }, data: { thumbnails: newThumbnails } });
  res.json({ ok: true, uploaded, item: v });
}));

// --- 刪除單張 thumbnail（同時刪 S3）---
router.delete('/variants/:vid/images', wrap(async (req, res) => {
  const url = req.body?.url;
  if (!url) return res.status(400).json({ ok: false, message: '缺少 url' });
  const variant = await prisma.variant.findUnique({ where: { id: req.params.vid } });
  if (!variant) return res.status(404).json({ ok: false, message: '找不到 variant' });

  const newThumbnails = (variant.thumbnails || []).filter(u => u !== url);
  const v = await prisma.variant.update({ where: { id: variant.id }, data: { thumbnails: newThumbnails } });
  try { await s3.deleteByUrl(url); } catch (e) { console.warn('[s3 delete fail]', url, e.message); }
  res.json({ ok: true, item: v });
}));

// --- 取代 variant 的 sizes（改庫存最簡單的做法）---
router.put('/variants/:vid/sizes', wrap(async (req, res) => {
  const sizes = Array.isArray(req.body?.sizes) ? req.body.sizes : [];
  await prisma.size.deleteMany({ where: { variantId: req.params.vid } });
  if (sizes.length) {
    await prisma.size.createMany({ data: sizes.map(s => ({ variantId: req.params.vid, label: String(s.label), stock: asInt(s.stock, 0) })) });
  }
  const v = await prisma.variant.findUnique({ where: { id: req.params.vid }, include: { sizes: true } });
  res.json({ ok: true, item: v });
}));

module.exports = router;
