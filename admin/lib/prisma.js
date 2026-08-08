// admin/lib/prisma.js
// 後台專用的 Prisma client（單例，避免 nodemon 重載時建立過多連線）。
// 連線字串來自 server.js 已載入的對應 .env（staging / prod）。
const { PrismaClient } = require('@prisma/client');

const prisma = globalThis.__ADMIN_PRISMA__ || new PrismaClient();
if (!globalThis.__ADMIN_PRISMA__) globalThis.__ADMIN_PRISMA__ = prisma;

module.exports = { prisma };
