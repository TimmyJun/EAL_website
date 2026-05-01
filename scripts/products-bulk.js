const productDefs = [
  {
    "slug": "Hole-Knit-Double-Zipper-Sweater",
    "title": "Hole Knit Double Zipper Sweater",
    "price": 1880,
    "year": 2026,
    "season": "SS",
    "description": `
  * Regular fit <br>
* Double Zipper <br>
* Hole Knit <br>
* 100% Cotton<br>
<br>
* 常規版型<br>
* 雙拉鍊<br>
* 網洞針織<br>
* 100% 棉材質<br>
<br>
* Size 1<br>
胸圍 Chest - 63cm<br>
衣長 Length - 54cm<br>
袖長 Sleeve - 66cm<br>
<br>
* Size 2<br>
胸圍 Chest - 67cm<br>
衣長 Length - 60cm<br>
袖長 Sleeve - 70cm<br>
<br>
* 尺寸皆為商品平量數據 單位皆為公分 *<br>
* Measurements are all in centimeters *`,
    "variants": [
      {
        "color": "Black",
        "colorCode": "#000000",
        "imageFiles": [
          "2025FW黑色洞洞拉鍊毛衣-01.png",
          "2025FW黑色洞洞拉鍊毛衣-02.png",
          "2025FW黑色洞洞拉鍊毛衣-03.png",
          "2025FW黑色洞洞拉鍊毛衣-04.png",
          "2025FW黑色洞洞拉鍊毛衣-05.png",
          "2025FW黑色洞洞拉鍊毛衣-06.png",

        ],
        sizes: [
          { label: "1", stock: 0 },
          { label: "2", stock: 0 }
        ]
      },
      {
        "color": "Iron Gray",
        "colorCode": "#727272",
        "imageFiles": [
          "2025FW黑色洞洞拉鍊毛衣-08.jpeg",
          "2025FW黑色洞洞拉鍊毛衣-09.jpeg",

        ],
        sizes: [
          { label: "1", stock: 10 },
          { label: "2", stock: 10 }
        ]
      },
      {
        "color": "Sage Green",
        "colorCode": "#738276",
        "imageFiles": [
          "2025FW黑色洞洞拉鍊毛衣-07.jpeg",
          "2025FW黑色洞洞拉鍊毛衣-10.jpeg",

        ],
        sizes: [
          { label: "1", stock: 10 },
          { label: "2", stock: 10 }
        ]
      }
    ]
  }
  // 之後要再加其他商品就繼續往下加
];

module.exports = { productDefs }