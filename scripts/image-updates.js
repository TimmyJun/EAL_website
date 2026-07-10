// scripts/image-updates.js
//
// 「只換圖」設定檔，搭配 scripts/update-product-images.js 使用。
// 這支腳本只會更新 DB variant 的 thumbnails（並刪除 S3 舊圖），
// 不會動到 price / sizes / stock / description 等其他欄位。
//
// 每一筆設定：
//   title      （必填）用來比對 DB 商品，需與資料庫中的商品標題「完全相符」
//   colorCode  （選填）當該商品有多個 variant 時，用來指定要換哪個顏色的圖；
//               若商品只有一個 variant 可省略
//   imageFiles （必填）新圖檔名陣列，檔案需放在專案根目錄的 seed-images/ 內；
//               會「完全取代」該 variant 原本的 thumbnails（非附加）

const imageUpdates = [
  {
    title: "Classic Raw Denim Jeans (Black)",
    // colorCode: "#ffffff",
    imageFiles: [
      "2026ss黑色原牛牛仔褲i-01.png",
      "2026ss黑色原牛牛仔褲i-02.png",
      "2026ss黑色原牛牛仔褲i-03.png",
      "2026ss黑色原牛牛仔褲i-04.png",
      "尺寸數據.png",
    ],
  },
  {
    title: "Classic Raw Denim Jeans (Blue)",
    // colorCode: "#ffffff",
    imageFiles: [
      "2026ss藍色原牛牛仔褲-01.png",
      "2026ss藍色原牛牛仔褲-02.png",
      "2026ss藍色原牛牛仔褲-03.png",
      "2026ss藍色原牛牛仔褲-04.png",
      "尺寸數據.png",
    ],
  },
  {
    title: "Flannel Patchwork Raw Denim Jeans (Black)",
    // colorCode: "#ffffff",
    imageFiles: [
      "2026ss黑色格紋原牛牛仔褲-01.png",
      "2026ss黑色格紋原牛牛仔褲-02.png",
      "2026ss黑色格紋原牛牛仔褲-03.png",
      "2026ss黑色格紋原牛牛仔褲-04.png",
      "2026ss黑色格紋原牛牛仔褲-05.png",
      "2026ss黑色格紋原牛牛仔褲-06.png",
      "尺寸數據1.png",
    ],
  },
  {
    title: "Flannel Patchwork Raw Denim Jeans (Blue)",
    // colorCode: "#ffffff",
    imageFiles: [
      "2026ss藍色格紋原牛牛仔褲-01.png",
      "2026ss藍色格紋原牛牛仔褲-02.png",
      "2026ss藍色格紋原牛牛仔褲-03.png",
      "2026ss藍色格紋原牛牛仔褲-04.png",
      "2026ss藍色格紋原牛牛仔褲-05.png",
      "2026ss藍色格紋原牛牛仔褲-06.png",
      "尺寸數據1.png",
    ],
  }
];

module.exports = { imageUpdates };
