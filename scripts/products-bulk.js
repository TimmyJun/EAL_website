const productDefs = [
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
        "color": "white",
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
          { label: "3", stock: 0 }
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
          { label: "3", stock: 0 }
        ]
      }
    ]
  },
  {
    "slug": "Straight-Pants",
    "title": "Straight Pants",
    "price": 1880,
    "year": 2023,
    "season": "SS",
    "description": `
  * EAL logo embroidery <br>
* Straight-leg fit <br>
* 100% Cotton<br>
<br>
* EAL Logo刺繡<br>
* 直筒褲版型<br>
* 100% 棉材質<br>
<br>
* Size 1<br>
腰圍 Waist - 73cm<br>
褲長 Length - 103cm<br>
臀圍 Hipline - 96cm<br>
<br>
* Size 2<br>
腰圍 Waist - 80cm<br>
褲長 Length - 106cm<br>
臀圍 Hipline - 104cm<br>
<br>
* Size 3<br>
腰圍 Waist - 85cm<br>
褲長 Length - 109cm<br>
臀圍 Hipline - 112cm<br>
<br>
* 尺寸皆為商品平量數據 單位皆為公分 *<br>
* Measurements are all in centimeters *`,
    "variants": [
      {
        "color": "cream",
        "colorCode": "#FFFDD0",
        "imageFiles": [
          "2023SS米色喇叭褲-01.jpg",
          "2023SS米色喇叭褲-02.jpg",
          "2023SS米色喇叭褲-03.jpg",
          "2023SS米色喇叭褲-04.jpg",
          "2023SS米色喇叭褲-05.jpg",
          "2023SS米色喇叭褲-06.jpg",
        ],
        sizes: [
          { label: "1", stock: 0 },
          { label: "2", stock: 5 },
          { label: "3", stock: 13 }
        ]
      }
    ]
  }
  // 之後要再加其他商品就繼續往下加
];

module.exports = { productDefs }