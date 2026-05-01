const productDefs = [
  {
    "slug": "Round-Neck-Tee",
    "title": "Round Neck Tee ",
    "price": 1280,
    "year": 2023,
    "season": "SS",
    "description": `
  * Collars in different colors <br>
* Loose Fit <br>
* 100% Cotton<br>
<br>
* 領子撞色設計<br>
* 寬鬆版型<br>
* 100% 棉材質<br>
<br>
* Size 1<br>
胸寬 Chest - 60cm<br>
衣長 Length - 68cm<br>
肩寬 Shoulder - 57cm<br>
<br>
* Size 2<br>
胸寬 Chest - 63cm<br>
衣長 Length - 71cm<br>
肩寬 Shoulder - 59cm<br>
<br>
* Size 3<br>
胸寬 Chest - 66cm<br>
衣長 Length - 74cm<br>
肩寬 Shoulder - 61cm<br>
<br>
* 尺寸皆為商品平量數據 單位皆為公分 *<br>
* Measurements are all in centimeters *`,
    "variants": [
      {
        "color": "White",
        "colorCode": "#FFFFFF",
        "imageFiles": [
          "2023SS黑色領子短袖-01.jpg",
          "2023SS黑色領子短袖-02.jpg",
          "2023SS黑色領子短袖-03.jpg",
          "2023SS黑色領子短袖-04.jpg"
        ],
        sizes: [
          { label: "1", stock: 0 },
          { label: "2", stock: 3 },
          { label: "2", stock: 0 }
        ]
      },
      {
        "color": "black",
        "colorCode": "#000000",
        "imageFiles": [
          "2023SS白色領子短袖-01.jpg",
          "2023SS白色領子短袖-02.jpg",
          "2023SS白色領子短袖-03.jpg",
          "2023SS白色領子短袖-04.jpg"
        ],
        sizes: [
          { label: "1", stock: 1 },
          { label: "2", stock: 0 },
          { label: "2", stock: 0 }
        ]
      }
    ]
  },
  {
    "slug": "Mess-Words-Tee",
    "title": "Mess Words Tee",
    "price": 1180,
    "year": 2023,
    "season": "SS",
    "description": `
  * Handwritten font Logo words <br>
* Loose Fit <br>
* 100% Cotton<br>
<br>
* 草寫文字字體<br>
* 寬鬆版型<br>
* 100% 棉材質<br>
<br>
* Size 1<br>
胸寬 Chest - 60cm<br>
衣長 Length - 68cm<br>
肩寬 Shoulder - 57cm<br>
<br>
* Size 2<br>
胸寬 Chest - 63cm<br>
衣長 Length - 71cm<br>
肩寬 Shoulder - 59cm<br>
<br>
* Size 3<br>
胸寬 Chest - 66cm<br>
衣長 Length - 74cm<br>
肩寬 Shoulder - 61cm<br>
<br>
* 尺寸皆為商品平量數據 單位皆為公分 *<br>
* Measurements are all in centimeters *`,
    "variants": [
      {
        "color": "White",
        "colorCode": "#FFFFFF",
        "imageFiles": [
          "2023SS白色草寫短袖-01.jpg",
          "2023SS白色草寫短袖-02.jpg",
          "2023SS白色草寫短袖-03.jpg",
          "2023SS白色草寫短袖-04.jpg"
        ],
        sizes: [
          { label: "1", stock: 0 },
          { label: "2", stock: 0 },
          { label: "2", stock: 0 }
        ]
      },
      {
        "color": "black",
        "colorCode": "#000000",
        "imageFiles": [
          "2023SS黑色草寫短袖-01.jpg",
          "2023SS黑色草寫短袖-02.jpg",
          "2023SS黑色草寫短袖-03.jpg",
          "2023SS黑色草寫短袖-04.jpg"
        ],
        sizes: [
          { label: "1", stock: 0 },
          { label: "2", stock: 0 },
          { label: "2", stock: 0 }
        ]
      }
    ]
  }
  // 之後要再加其他商品就繼續往下加
];

module.exports = { productDefs }