// lib/uploadToS3.js
const { s3, S3_BUCKET, S3_PUBLIC_BASE_URL } = require('./s3Client');
const { Upload } = require('@aws-sdk/lib-storage');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

async function uploadLocalFileToS3(localFilePath, options = {}) {
  const fileStream = fs.createReadStream(localFilePath);
  const baseName = path.basename(localFilePath); // 活頁短褲_251122_1.jpg
  const folder = options.folder || 'images';     // e.g. products/tight-fit-tee/white
  const key = `${folder}/${randomUUID()}-${baseName}`;

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: S3_BUCKET,
      Key: key,
      Body: fileStream,
      ContentType: 'image/jpeg', // 你目前這張是 jpg
      // ACL: 'public-read', // 如果 bucket 公開可讀就可以加
    },
  });

  await upload.done();

  const url = `${S3_PUBLIC_BASE_URL}/${key}`;
  return { key, url };
}

module.exports = { uploadLocalFileToS3 };
