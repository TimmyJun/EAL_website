const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

exports.list = async (req, res) => {
  try {
    const items = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { variants: { include: { sizes: true } } },
    });
    res.json(items);
  } catch (e) {
    console.error('[list error]', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;            // ← 一定要從 params 拿
    const item = await prisma.product.findUnique({
      where: { id },
      include: { variants: { include: { sizes: true } } },
    });

    if (!item) return res.status(404).json({ message: 'Not found' })
    res.json(item);
  } catch (e) {
    console.error('[getOne error]', e);
    res.status(500).json({ message: 'Server error' })
  }
}