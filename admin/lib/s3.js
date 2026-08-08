// admin/lib/s3.js
// S3 上傳 / 刪除 helper。沿用專案既有腳本的環境變數與 key 命名慣例：
//   AWS_REGION / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_S3_BUCKET / S3_PUBLIC_BASE_URL
//   key 格式：products/{title}/{color}/{uuid}-{原始檔名}
const path = require('path');
const { randomUUID } = require('crypto');
const { Upload } = require('@aws-sdk/lib-storage');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.AWS_S3_BUCKET;
const PUBLIC_BASE = (process.env.S3_PUBLIC_BASE_URL || '').replace(/\/+$/, '');

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// 依副檔名判斷 Content-Type（與 update-product-images.js 一致）
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

// 把字串整理成適合當 S3 資料夾的片段（與 update-product-images.js 一致）
function sanitizeSegment(str) {
  return String(str || '').trim().replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '') || 'untitled';
}

// 由公開網址反推 S3 key；推不出來回傳 null
function keyFromUrl(url) {
  if (!url || !PUBLIC_BASE) return null;
  if (!url.startsWith(PUBLIC_BASE + '/')) return null;
  return url.slice(PUBLIC_BASE.length + 1);
}

// 上傳一個 Buffer 到 S3，回傳 { key, url }
async function uploadBuffer(buffer, originalName, { title, color } = {}) {
  if (!BUCKET || !PUBLIC_BASE) {
    throw new Error('AWS_S3_BUCKET 或 S3_PUBLIC_BASE_URL 未設定，請檢查載入的 .env');
  }
  const folder = `products/${sanitizeSegment(title)}/${sanitizeSegment(color)}`;
  const safeName = path.basename(originalName || 'image');
  const key = `${folder}/${randomUUID()}-${safeName}`;

  const uploader = new Upload({
    client: s3,
    params: {
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentTypeFor(safeName),
    },
  });
  await uploader.done();

  return { key, url: `${PUBLIC_BASE}/${key}` };
}

// 依公開網址刪除 S3 物件；解析不出 key 就略過（回傳 false）
async function deleteByUrl(url) {
  const key = keyFromUrl(url);
  if (!key) return false;
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  return true;
}

module.exports = { s3, uploadBuffer, deleteByUrl, keyFromUrl, contentTypeFor, sanitizeSegment, BUCKET, PUBLIC_BASE, REGION };
