// models/productModel.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 共用：把 type(ss|fw) 轉為 season(SS|FW)
function normalizeSeasonFromType(type) {
  if (!type) return undefined;
  const t = String(type).toUpperCase();
  return t === 'SS' || t === 'FW' ? t : undefined;
}

async function listProducts({ year, type } = {}) {
  const season = normalizeSeasonFromType(type);
  const where = {
    ...(year ? { year: Number(year) } : {}),
    ...(season ? { season } : {}),
    // ...(published !== undefined ? { published } : {}),
  };

  return prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { variants: { include: { sizes: true } } },
  });
}

async function getAllProducts() {
  return prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: { variants: { include: { sizes: true } } },
  });
}

async function getProductById(id) {
  return prisma.product.findUnique({
    where: { id },
    include: { variants: { include: { sizes: true } } },
  });
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
};