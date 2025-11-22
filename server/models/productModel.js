// models/productModel.js
const { PrismaClient } = require('@prisma/client');
// 在 serverless 環境重用 PrismaClient，避免每次 cold start 建立新連線
const prisma = globalThis.__PRISMA__ || new PrismaClient();
if (!globalThis.__PRISMA__) globalThis.__PRISMA__ = prisma;

// 共用：把 type(ss|fw) 轉為 season(SS|FW)
function normalizeSeasonFromType(type) {
  if (!type) return undefined;
  const t = String(type).toUpperCase();
  return ['SS', 'FW', 'AW'].includes(t) ? t : undefined;
}

function sortSizesOnProduct(product) {
  if (!product || !Array.isArray(product.variants)) return product;

  return {
    ...product,
    variants: product.variants.map((v) => ({
      ...v,
      sizes: Array.isArray(v.sizes)
        ? [...v.sizes].sort((a, b) => Number(a.label) - Number(b.label))
        : [],
    })),
  };
}

function sortSizesOnProducts(products) {
  if (!Array.isArray(products)) return products;
  return products.map(sortSizesOnProduct);
}

async function listProducts({ year, type } = {}) {
  const season = normalizeSeasonFromType(type);
  const where = {
    ...(year ? { year: Number(year) } : {}),
    ...(season ? { season } : {}),
  };

  const rows = await prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      variants: {
        include: { sizes: true },
      },
    },
  });

  return sortSizesOnProducts(rows);
}

async function getAllProducts() {
  const rows = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      variants: {
        include: { sizes: true },
      },
    },
  });

  return sortSizesOnProducts(rows);
}

async function getProductById(id) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        include: {
          sizes: true, // 這邊先單純拿出來
        },
      },
    },
  });

  return sortSizesOnProduct(product);
}

async function getProductsByIds(ids = []) {
  const uniq = [...new Set(ids)].filter(Boolean);
  if (!uniq.length) return [];

  const rows = await prisma.product.findMany({
    where: { id: { in: uniq } },
    orderBy: { createdAt: 'desc' },
    include: {
      variants: {
        include: { sizes: true },
      },
    },
  });

  return sortSizesOnProducts(rows);
}

// 取得去重的 (year, season) 清單
async function getSeasonTags() {
  const rows = await prisma.product.findMany({
    distinct: ['year', 'season'],
    select: { year: true, season: true }, // season: 'SS' | 'FW'
    orderBy: [{ year: 'desc' }, { season: 'desc' }],
  });
  return rows; // 交給 service/controller 做 label 組合
}

module.exports = {
  listProducts,
  getAllProducts,
  getProductById,
  getSeasonTags,
  getProductsByIds
};