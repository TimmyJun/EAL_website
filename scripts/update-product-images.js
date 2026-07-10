// scripts/update-product-images.js
//
// 「只換圖」執行腳本。
//   - 依 title 定位 DB 商品，找出要換圖的 variant
//   - 上傳新圖到 S3（ContentType 依副檔名判斷）
//   - 將 variant.thumbnails「整組取代」為新網址
//   - 更新成功後刪除該 variant 原本的 S3 舊圖
//
// 使用方式：
//   node scripts/update-product-images.js            實際執行
//   DRY_RUN=1 node scripts/update-product-images.js  只預覽、不上傳/不改DB/不刪檔
//
// 設定來源：scripts/image-updates.js

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { Upload } = require('@aws-sdk/lib-storage');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { imageUpdates } = require('./image-updates.js');

const prisma = new PrismaClient();

const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

// === S3 Setup ===（沿用 seed-bulk-products.js 的環境變數）
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET;
const PUBLIC_BASE = process.env.S3_PUBLIC_BASE_URL;

// 依副檔名判斷 Content-Type（修正原 seed 腳本寫死 image/jpeg 的問題）
function contentTypeFor(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    case '.gif': return 'image/gif';
    case '.avif': return 'image/avif';
    default: return 'application/octet-stream';
  }
}

// 由公開網址反推 S3 key（去掉 PUBLIC_BASE 前綴）；推不出來回傳 null
function keyFromUrl(url) {
  if (!url || !PUBLIC_BASE) return null;
  const base = PUBLIC_BASE.replace(/\/+$/, '');
  if (!url.startsWith(base + '/')) return null;
  return url.slice(base.length + 1);
}

// 把字串整理成適合當 S3 資料夾的片段
function sanitizeSegment(str) {
  return String(str).trim().replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '');
}

// 上傳單一檔案到 S3
async function uploadLocalFileToS3(localFilePath, folder) {
  const baseName = path.basename(localFilePath);
  const key = `${folder}/${randomUUID()}-${baseName}`;

  const uploader = new Upload({
    client: s3,
    params: {
      Bucket: BUCKET,
      Key: key,
      Body: fs.createReadStream(localFilePath),
      ContentType: contentTypeFor(baseName),
    },
  });

  await uploader.done();
  return `${PUBLIC_BASE.replace(/\/+$/, '')}/${key}`;
}

// 刪除單一 S3 物件
async function deleteS3Object(key) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

// 處理單一換圖設定
async function processOne(update) {
  const { title, colorCode, imageFiles } = update;

  if (!title || !Array.isArray(imageFiles) || imageFiles.length === 0) {
    console.error(`⚠️  略過一筆設定：title 或 imageFiles 未正確填寫 → ${JSON.stringify(update)}`);
    return { skipped: true };
  }

  console.log(`\n🔎 處理商品：「${title}」${colorCode ? `（colorCode: ${colorCode}）` : ''}`);

  // 1) 依 title 找商品
  const products = await prisma.product.findMany({
    where: { title },
    include: { variants: true },
  });

  if (products.length === 0) {
    console.error(`❌ 找不到標題為「${title}」的商品，略過（不會新建商品）。`);
    return { skipped: true };
  }
  if (products.length > 1) {
    console.error(`❌ 有 ${products.length} 個商品同名為「${title}」，無法判斷，略過。請改用更精確的定位方式。`);
    return { skipped: true };
  }

  const product = products[0];

  // 2) 定位 variant
  let variant;
  if (colorCode) {
    variant = product.variants.find((v) => v.colorCode === colorCode);
    if (!variant) {
      console.error(`❌ 商品「${title}」找不到 colorCode = ${colorCode} 的 variant，略過。`);
      return { skipped: true };
    }
  } else {
    if (product.variants.length === 0) {
      console.error(`❌ 商品「${title}」沒有任何 variant，略過。`);
      return { skipped: true };
    }
    if (product.variants.length > 1) {
      console.error(`❌ 商品「${title}」有多個 variant，請在設定檔補上 colorCode 指定要換哪一個，略過。`);
      return { skipped: true };
    }
    variant = product.variants[0];
  }

  // 3) 檢查本地圖檔都存在（缺檔立即失敗，不做半套）
  const localPaths = imageFiles.map((f) => path.join(__dirname, '../seed-images', f));
  for (const p of localPaths) {
    if (!fs.existsSync(p)) {
      console.error(`❌ 找不到圖片：${p}`);
      process.exit(1);
    }
  }

  const oldThumbnails = variant.thumbnails || [];
  const folderPrefix = `products/${sanitizeSegment(product.title)}/${sanitizeSegment(variant.color)}`;

  // DRY RUN：只顯示計畫，不實際動作
  if (DRY_RUN) {
    console.log(`   [DRY RUN] 目標 variant：${variant.id}（color: ${variant.color}, colorCode: ${variant.colorCode}）`);
    console.log(`   [DRY RUN] 會上傳到資料夾：${folderPrefix}/`);
    imageFiles.forEach((f) => console.log(`   [DRY RUN]   ⤴ ${f}`));
    console.log(`   [DRY RUN] thumbnails 會由 ${oldThumbnails.length} 張整組換成 ${imageFiles.length} 張`);
    const delKeys = oldThumbnails.map(keyFromUrl);
    delKeys.forEach((k, i) => {
      console.log(`   [DRY RUN] 會刪除舊圖：${k ? k : `(無法解析，將略過) ${oldThumbnails[i]}`}`);
    });
    return { dryRun: true };
  }

  // 4) 上傳新圖
  const newThumbnails = [];
  for (const localPath of localPaths) {
    const url = await uploadLocalFileToS3(localPath, folderPrefix);
    console.log(`   📤 已上傳：${path.basename(localPath)} → ${url}`);
    newThumbnails.push(url);
  }

  // 5) 整組取代 thumbnails
  await prisma.variant.update({
    where: { id: variant.id },
    data: { thumbnails: newThumbnails },
  });
  console.log(`   ✅ 已更新 variant ${variant.id} 的 thumbnails（${oldThumbnails.length} → ${newThumbnails.length} 張）`);

  // 6) 刪除 S3 舊圖（更新成功後才刪；解析不出 key 就略過）
  for (const oldUrl of oldThumbnails) {
    const key = keyFromUrl(oldUrl);
    if (!key) {
      console.warn(`   ⚠️  舊圖網址無法解析為 S3 key，略過刪除：${oldUrl}`);
      continue;
    }
    try {
      await deleteS3Object(key);
      console.log(`   🗑️  已刪除 S3 舊圖：${key}`);
    } catch (e) {
      console.warn(`   ⚠️  刪除 S3 舊圖失敗（不中斷）：${key} → ${e.message}`);
    }
  }

  return { updated: true };
}

async function main() {
  if (!BUCKET || !PUBLIC_BASE) {
    console.error('❌ 環境變數 AWS_S3_BUCKET 或 S3_PUBLIC_BASE_URL 未設定，請檢查 .env。');
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log('🧪 DRY RUN 模式：只預覽，不會上傳、不改 DB、不刪檔。');
  }

  let updated = 0, skipped = 0, dry = 0;
  for (const u of imageUpdates) {
    const r = await processOne(u);
    if (r.updated) updated++;
    else if (r.skipped) skipped++;
    else if (r.dryRun) dry++;
  }

  console.log(`\n📊 完成：更新 ${updated} 筆、略過 ${skipped} 筆${DRY_RUN ? `、預覽 ${dry} 筆` : ''}。`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
