require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const one = await prisma.variant.findFirst({
    select: { id: true, color: true, colorCode: true }
  });
  console.log('variant sample:', one);
  process.exit(0);
})();
