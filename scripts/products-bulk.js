const productDefs = [
  {
    slug: "wms-mohair-knit-short-sweater",
    title: "WMS Mohair Knit Short Sweater（Women‘s Line）",
    price: 1780,
    year: 2025,
    season: "AW",
    description: `* Short fit
* Metal logo tag
* 100% Mohair Knit

* 短版版型
* 金屬Logo標
* 100% 馬海毛

* Size 1
胸圍 Chest - 53cm
衣長 Length - 33cm
袖長 Sleeve - 74cm

* Size 2
胸圍 Chest - 56cm
衣長 Length - 38cm
袖長 Sleeve - 76cm

* 尺寸皆為商品平量數據 單位皆為公分 *
* Measurements are all in centimeters *

* 陸續在各路經銷商上架
* Soon will be available at selected retail stores.`,
    variants: [
      {
        color: "Blue White",
        colorCode: "#BDD5e7",
        imageFiles: [
          "WMS-Mohair-Knit-Short-Sweater-front.jpg",
          "WMS-Mohair-Knit-Short-Sweater-back.jpg",
          "WMS-Mohair-Knit-Short-Sweater-closefront.jpg",
          "WMS-Mohair-Knit-Short-Sweater-fabric.jpg",
          "WMS-Mohair-Knit-Short-Sweater-sizechart.jpg"
        ],
        sizes: [
          { label: "1", stock: 10 },
          { label: "2", stock: 16 },
        ]
      }
    ]
  },

  {
    slug: "hole-Knit-double-zipper-sweater",
    title: "Hole Knit Double Zipper Sweater",
    price: 1880,
    year: 2025,
    season: "AW",
    description: `* Regular fit
* Double Zipper
* Hole Knit
* 100% Cotton

* 常規版型
* 雙拉鍊
* 網洞針織
* 100% 棉材質

* Size 1
胸圍 Chest - 63cm
衣長 Length - 54cm
袖長 Sleeve - 66cm

* Size 2
胸圍 Chest - 67cm
衣長 Length - 60cm
袖長 Sleeve - 70cm

* 尺寸皆為商品平量數據 單位皆為公分 *
* Measurements are all in centimeters *

* 陸續在各路經銷商上架
* Soon will be available at selected retail stores.`,
    variants: [
      {
        color: "Black",
        colorCode: "#111111",
        imageFiles: [
          "hole-Knit-double-zipper-sweater-front.jpg",
          "hole-Knit-double-zipper-sweater-back.jpg",
          "hole-Knit-double-zipper-sweater-closefront.jpg",
          "hole-Knit-double-zipper-sweater-fabric.jpg",
        ],
        sizes: [
          { label: "1", stock: 18 },
          { label: "2", stock: 18 },
        ]
      }
    ]
  }

  // 之後要再加其他商品就繼續往下加
];

module.exports = { productDefs };
