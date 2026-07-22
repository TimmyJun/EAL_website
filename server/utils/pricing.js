// server/utils/pricing.js
//
// 折扣邏輯的「單一真相」。所有售價計算與「哪些商品要打折」的規則都集中在這裡，
// productModel 會在回傳每個 product 前套用 computePricing()，
// 讓 /api/products、/api/products/:id、/api/products/batch 都自動帶折後價。
//
// 規則：除了「26SS（year=2026 且 season=SS）」與「Archive Sale（isArchived=true）」以外，
//       其餘商品一律打 7 折。

const DISCOUNT_RATE = 0.7; // 7 折

// 被排除、維持原價的季別（year + season）
const EXCLUDED_SEASONS = [
  { year: 2026, season: 'SS' },
];

// 判斷某商品是否適用折扣
function isOnSale(product = {}) {
  if (!product) return false;
  if (product.isArchived) return false; // Archive Sale 維持原價

  const year = Number(product.year);
  const season = String(product.season || '').toUpperCase();
  const isExcludedSeason = EXCLUDED_SEASONS.some(
    (e) => e.year === year && e.season === season
  );
  if (isExcludedSeason) return false;

  return true;
}

// 計算售價資訊；回傳可直接併入 product 物件的欄位
function computePricing(product = {}) {
  const originalPrice = Number(product.price) || 0;
  const onSale = isOnSale(product);
  const salePrice = onSale ? Math.round(originalPrice * DISCOUNT_RATE) : originalPrice;

  return {
    originalPrice,
    salePrice,
    onSale,
    discountRate: onSale ? DISCOUNT_RATE : 1,
  };
}

// 把 computePricing 的結果併進 product 物件（price 原欄位維持原價不動）
function withPricing(product) {
  if (!product || typeof product !== 'object') return product;
  return { ...product, ...computePricing(product) };
}

module.exports = {
  DISCOUNT_RATE,
  EXCLUDED_SEASONS,
  isOnSale,
  computePricing,
  withPricing,
};
