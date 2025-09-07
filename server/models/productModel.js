const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getAllProducts() {
  return prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      variants: {
        include: { sizes: true }
      }
    }
  });
}

async function getProductById(id) {
  return prisma.product.findUnique({
    where: { id },
    include: { variants: { include: { sizes: true } } },
  });
}

module.exports = { getAllProducts, getProductById }