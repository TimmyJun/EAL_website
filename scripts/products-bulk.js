const productDefs = [
  {
    slug: "double-up-plaid-shirt",
    title: "Double Up Plaid Shirt",
    price: 3280,
    year: 2025,
    season: "AW",
    description: `* Boxy fit<br>
* Double Layered also can be torn by your own<br>
* Metal Logo Tag<br>
* Bottle cap button<br>
* Destroyed at the bottom and sleeves<br>
* 100% Cotton<br>
<br>
* 短寬版型<br>
* 雙層格紋面料，可自行撕毀破壞<br>
* 金屬 Logo<br>
* 破壞毛絮處理於下擺與袖口<br>
* 100% 棉材質<br>
<br>
* Size 1<br>
胸圍 Chest - 60cm<br>
衣長 Length - 56cm<br>
袖長 Sleeve - 76cm<br>
<br>
* Size 2<br>
胸圍 Chest - 62cm<br>
衣長 Length - 62cm<br>
袖長 Sleeve - 78cm<br>
<br>
* 尺寸皆為商品平量數據，單位皆為公分<br>
* Measurements are all in centimeters`,
    variants: [
      {
        color: "Yellow",
        colorCode: "#EDC247",
        imageFiles: [
          "yellow-1.jpg",
          "yellow-2.jpg",
          "yellow-3.jpg",
          "yellow-4.jpg",
          "yellow-5.jpg",
          "yellow-6.jpg",
          "yellow-7.jpg",
          "yellow-8.jpg",
          "yellow-9.jpg",
        ],
        sizes: [
          { label: "1", stock: 9 },
          { label: "2", stock: 9 },
        ]
      }
    ]
  }

  // 之後要再加其他商品就繼續往下加
];

module.exports = { productDefs }