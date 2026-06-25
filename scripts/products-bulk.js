const productDefs = [
  {
    slug: "Tops-Bundles",          // S3 資料夾路徑用,英數與 - ，需唯一
    title: "Tops Bundles",         // 顯示名稱,也用來判斷是否已存在(同名會更新)
    price: 1080,                            // 整數,新台幣
    year: 2026,                           // 必填:archived 時不顯示,但解除封存會回到此季別
    season: "SS",                         // 必填:SS / FW / AW 其一
    isArchived: true,                     // ★ 關鍵:歸入 Archive Sale(省略則預設 false)
    description: `
ARCHIVE SALE...<br>
<br>
品牌官網獨家限量組合<br>
Official Website Exclusive Limited Edition Bundles<br>
(Tops / Bottoms / Top + Bottom Sets)<br>
<br>
(請標注身高體重，尺寸依照庫存數量為主)<br>`,
    variants: [
      {
        color: "Tops",                   
        colorCode: "#ffffff",           
        imageFiles: [                    
          "archive.png"
        ],
        sizes: [
          { label: "1", stock: 10 },       
          { label: "2", stock: 11 },
          { label: "3", stock: 12 }
        ]
      }
    ]
  },
  {
    slug: "Bottoms-Bundles",          // S3 資料夾路徑用,英數與 - ，需唯一
    title: "Bottoms Bundles",         // 顯示名稱,也用來判斷是否已存在(同名會更新)
    price: 1880,                            // 整數,新台幣
    year: 2026,                           // 必填:archived 時不顯示,但解除封存會回到此季別
    season: "SS",                         // 必填:SS / FW / AW 其一
    isArchived: true,                     // ★ 關鍵:歸入 Archive Sale(省略則預設 false)
    description: `
ARCHIVE SALE...<br>
<br>
品牌官網獨家限量組合<br>
Official Website Exclusive Limited Edition Bundles<br>
(Tops / Bottoms / Top + Bottom Sets)<br>
<br>
(請標注身高體重，尺寸依照庫存數量為主)<br>`,
    variants: [
      {
        color: "Tops",
        colorCode: "#ffffff",
        imageFiles: [
          "archive.png"
        ],
        sizes: [
          { label: "1", stock: 10 },
          { label: "2", stock: 11 },
          { label: "3", stock: 12 }
        ]
      }
    ]
  },
  {
    slug: "Tops-Bottoms Bundles",          // S3 資料夾路徑用,英數與 - ，需唯一
    title: "Tops + Bottoms Bundles",         // 顯示名稱,也用來判斷是否已存在(同名會更新)
    price: 2480,                            // 整數,新台幣
    year: 2026,                           // 必填:archived 時不顯示,但解除封存會回到此季別
    season: "SS",                         // 必填:SS / FW / AW 其一
    isArchived: true,                     // ★ 關鍵:歸入 Archive Sale(省略則預設 false)
    description: `
ARCHIVE SALE...<br>
<br>
品牌官網獨家限量組合<br>
Official Website Exclusive Limited Edition Bundles<br>
(Tops / Bottoms / Top + Bottom Sets)<br>
<br>
(請標注身高體重，尺寸依照庫存數量為主)<br>`,
    variants: [
      {
        color: "Tops",
        colorCode: "#ffffff",
        imageFiles: [
          "archive.png"
        ],
        sizes: [
          { label: "1", stock: 10 },
          { label: "2", stock: 11 },
          { label: "3", stock: 12 }
        ]
      }
    ]
  }
  // 之後要再加其他商品就繼續往下加
  // 若要把商品歸入「Archive Sale」獨立類別，於該商品物件加上 isArchived: true
  // （加上後該商品會從原年份/季別分類消失，只出現在 Archive Sale；省略時預設 false）
];

module.exports = { productDefs }