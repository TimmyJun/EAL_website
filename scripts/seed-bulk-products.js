// prisma/seed-bulk-products.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const fs = require('fs');
const { Upload } = require('@aws-sdk/lib-storage');
const { S3Client } = require('@aws-sdk/client-s3');
const { randomUUID } = require('crypto');
const { productDefs } = require('./products-bulk.js'); // 上面那個 productDefs

// === S3 Setup ===
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET;
const PUBLIC_BASE = process.env.S3_PUBLIC_BASE_URL;

// 上傳單一檔案到 S3
async function uploadLocalFileToS3(localFilePath, folder) {
  const fileStream = fs.createReadStream(localFilePath);
  const baseName = path.basename(localFilePath);
  const key = `${folder}/${randomUUID()}-${baseName}`;

  const uploader = new Upload({
    client: s3,
    params: {
      Bucket: BUCKET,
      Key: key,
      Body: fileStream,
      ContentType: 'image/jpeg',
    },
  });

  await uploader.done();

  const url = `${PUBLIC_BASE}/${key}`;
  return { key, url };
}

// 上傳某個 product 的某一個 variant 裡的多張圖片
async function uploadVariantImages(productSlug, variant) {
  const thumbnails = [];
  const folderPrefix = `products/${productSlug}/${variant.color}`;

  for (const filename of variant.imageFiles) {
    const localPath = path.join(__dirname, '../seed-images', filename);

    if (!fs.existsSync(localPath)) {
      console.error(`❌ 找不到圖片：${localPath}`);
      process.exit(1);
    }

    const { url } = await uploadLocalFileToS3(localPath, folderPrefix);
    console.log(`📤 Uploaded ${productSlug}/${variant.color}/${filename} → ${url}`);
    thumbnails.push(url);
  }

  return thumbnails;
}

// seed 單一商品（但支援多 variants、多圖）
async function seedSingleProduct(productDef) {
  const { slug, title, price, year, season, description, variants } = productDef;

  console.log(`\n🚀 開始處理商品：${title} (${slug})`);

  // 先把 variant 的 thumbnails 準備好
  const variantsToCreate = [];

  for (const v of variants) {
    const thumbnails = await uploadVariantImages(slug, v);

    variantsToCreate.push({
      color: v.color,
      colorCode: v.colorCode,
      thumbnails,
      sizes: {
        create: (v.sizes || []).map((s) => ({
          label: s.label,
          stock: s.stock,
        })),
      },
    });
  }

  // 確認 DB 是否已存在同名商品
  const existing = await prisma.product.findFirst({ where: { title } });

  let product;
  if (!existing) {
    product = await prisma.product.create({
      data: {
        title,
        price,
        year,
        season,
        description,
        variants: { create: variantsToCreate },
      },
      include: { variants: { include: { sizes: true } } },
    });

    console.log(`✅ Created product: ${product.title} ${product.id}`);
  } else {
    // 和你現在 single 版一樣：重建 variants / sizes
    await prisma.size.deleteMany({
      where: { variant: { productId: existing.id } },
    });

    await prisma.variant.deleteMany({
      where: { productId: existing.id }
    },
    );

    product = await prisma.product.update({
      where: { id: existing.id },
      data: {
        title,
        price,
        year,
        season,
        description,
        variants: { create: variantsToCreate },
      },
      include: { variants: { include: { sizes: true } } },
    });

    console.log(`🔁 Updated product: ${product.title} ${product.id}`);
  }

  return product;
}

// main：一次跑多個商品
async function main() {
  for (const p of productDefs) {
    await seedSingleProduct(p);
  }
}

main()
  .then(() => {
    console.log('\n🎉 Bulk product seed 完成！');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });