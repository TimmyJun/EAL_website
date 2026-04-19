const productDefs = [
//   {
//     "slug": "Raglan-Tee",
//     "title": "Raglan Tee",
//     "price": 1380,
//     "year": 2025,
//     "season": "FW",
//     "description": `
//   * Regular fit <br>
// * Logo metal tag <br>
// * 100% Cotton<br>
// <br>
// * 常規版型<br>
// * Logo金屬標<br>
// * 100% 棉材質<br>
// <br>
// * Size 1<br>
// 胸圍 Chest - 56cm<br>
// 衣長 Length - 60cm<br>
// 袖長 Sleeve - 37cm<br>
// <br>
// * Size 2<br>
// 胸圍 Chest - 58cm<br>
// 衣長 Length - 62cm<br>
// 袖長 Sleeve - 38cm<br>
// <br>
// * Size 3<br>
// 胸圍 Chest - 60m<br>
// 衣長 Length - 64cm<br>
// 袖長 Sleeve - 39cm<br>
// <br>
// * 尺寸皆為商品平量數據 單位皆為公分 *<br>
// * Measurements are all in centimeters *`,
//     "variants": [
//       {
//         "color": "Black",
//         "colorCode": "#000000",
//         "imageFiles": [
//           "2025FW黑色拉克蘭短袖-01.jpg",
//           "2025FW黑色拉克蘭短袖-02.jpg",
//           "2025FW黑色拉克蘭短袖-03.jpg",
//           "2025FW黑色拉克蘭短袖-04.jpg"
//         ],
//         sizes: [
//           { label: "1", stock: 0 },
//           { label: "2", stock: 8 },
//           { label: "3", stock: 3 }
//         ]
//       },
//       {
//         "color": "White",
//         "colorCode": "#FFFFFF",
//         "imageFiles": [
//           "2025FW白色拉克蘭短袖-01.jpg",
//           "2025FW白色拉克蘭短袖-02.jpg",
//           "2025FW白色拉克蘭短袖-03.jpg",
//           "2025FW白色拉克蘭短袖-04.jpg"
//         ],
//         sizes: [
//           { label: "1", stock: 0 },
//           { label: "2", stock: 8 },
//           { label: "3", stock: 3 }
//         ]
//       }
//     ]
//   },
//   {
//     "slug": "Reversed-Baggy-Double-Knees-Jeans",
//     "title": "Reversed Baggy Double Knees Jeans",
//     "price": 3280,
//     "year": 2025,
//     "season": "FW",
//     "description": `
//   * Baggy Loose fit <br>
// * Logo leather tag <br>
// * Reversed pocket <br>
// * Double Knees <br>
// * Destroy design<br>
// <br>
// * 寬鬆寬褲版型<br>
// * 五金皮牌<br>
// * 反面口袋<br>
// * 雙膝蓋<br>
// * 破壞做舊<br>
// <br>
// * Size 0（WMS 女碼）<br>
// 腰圍 Waist - 68cm<br>
// 大腿 Thigh - 35cm<br>
// 褲長 Length - 100cm<br>
// <br>
// * Size 1<br>
// 腰圍 Waist - 80cm<br>
// 大腿 Thigh - 36cm<br>
// 褲長 Length - 110cm<br>
// <br>
// * Size 2<br>
// 腰圍 Waist - 86cm<br>
// 大腿 Thigh - 37cm<br>
// 褲長 Length - 113cm<br>
// <br>
// * Size 3<br>
// 腰圍 Waist - 90cm<br>
// 大腿 Thigh - 38cm<br>
// 褲長 Length - 115cm<br>
// <br>
// * 尺寸皆為商品平量數據 單位皆為公分 *<br>
// * Measurements are all in centimeters *`,
//     "variants": [
//       {
//         "color": "Washed Black",
//         "colorCode": "#000000",
//         "imageFiles": [
//           "2025FW黑色牛仔褲-01.png",
//           "2025FW黑色牛仔褲-02.png",
//           "2025FW黑色牛仔褲-03.png",
//           "2025FW黑色牛仔褲-04.png",
//           "2025FW黑色牛仔褲-05.png",
//           "2025FW黑色牛仔褲-06.png",
//           "2025FW黑色牛仔褲-07.png"
//         ],
//         sizes: [
//           { label: "0", stock: 0 },
//           { label: "1", stock: 0 },
//           { label: "2", stock: 8 },
//           { label: "3", stock: 3 }
//         ]
//       }
//     ]
//   },
//   {
//     "slug": "WMS-Off-Shoulder-Line-Short-Shirt",
//     "title": "WMS Off Shoulder Line Short Shirt",
//     "price": 1080,
//     "year": 2025,
//     "season": "FW",
//     "description": `
//  * Slim-fit <br>
// * Embroidered logo <br>
// * Off-the-shoulder design <br>
// * Lace detailing at shoulders <br>
// * Velvety fabric<br>
// <br>
// * 短版合身版型<br>
// * 刺繡Logo<br>
// * 一字領露肩設計<br>
// * 肩膀處蕾絲細節<br>
// * 絨感面料<br>
// <br>
// * Size 1（WMS）<br>
// 胸圍 Chest - 30cm<br>
// 衣長 Length - 35cm<br>
// 袖長 Sleeve - 58cm<br>
// 領口 Off Shoulder - 40cm<br>
// <br>
// * Size 2（WMS）<br>
// 胸圍 Chest - 32cm<br>
// 衣長 Length - 37cm<br>
// 袖長 Sleeve - 60cm<br>
// 領口 Off Shoulder - 42cm<br>
// <br>
// * 尺寸皆為商品平量數據 單位皆為公分 *<br>
// * Measurements are all in centimeters *`,
//     "variants": [
//       {
//         "color": "Black",
//         "colorCode": "#000000",
//         "imageFiles": [
//           "2025WMS一字領黑色-01.jpg",
//           "2025WMS一字領黑色-02.jpg",
//           "2025WMS一字領黑色-03.jpg",
//           "2025WMS一字領黑色-04.jpg",
//           "2025WMS一字領黑色-05.jpg",
//           "2025WMS一字領黑色-06.jpg",
//           "2025WMS一字領黑色-07.jpg"
//         ],
//         sizes: [
//           { label: "1", stock: 22 },
//           { label: "2", stock: 16 }
//         ]
//       },
//       {
//         "color": "White",
//         "colorCode": "#FFFFFF",
//         "imageFiles": [
//           "2025WMS一字領白色-01.jpg",
//           "2025WMS一字領白色-02.jpg",
//           "2025WMS一字領白色-03.jpg",
//           "2025WMS一字領白色-04.jpg",
//           "2025WMS一字領白色-05.jpg",
//           "2025WMS一字領白色-06.jpg",
//           "2025WMS一字領白色-07.jpg"
//         ],
//         sizes: [
//           { label: "1", stock: 13 },
//           { label: "2", stock: 28 }
//         ]
//       }
//     ]
//   },
//   {
//     "slug": "WMS-3M-Reflective-Jersey",
//     "title": "WMS 3M Reflective Jersey",
//     "price": 1580,
//     "year": 2025,
//     "season": "FW",
//     "description": `
//  * Short fit <br>
// * Embroidered logo <br>
// * Reflective print on the back<br>
// <br>
// * 短寬版型<br>
// * 刺繡Logo<br>
// * 背後數字反光印花<br>
// <br>
// * Size 1（WMS）<br>
// 胸圍 Chest - 55cm<br>
// 衣長 Length - 43cm<br>
// 袖長 Sleeve - 72cm<br>
// <br>
// * Size 2（WMS）<br>
// 胸圍 Chest - 58cm<br>
// 衣長 Length - 45cm<br>
// 袖長 Sleeve - 75cm<br>
// <br>
// * 尺寸皆為商品平量數據 單位皆為公分 *<br>
// * Measurements are all in centimeters *`,
//     "variants": [
//       {
//         "color": "Black Pink",
//         "colorCode": "#000000",
//         "imageFiles": [
//           "2025FW黑粉色球衣-01.jpg",
//           "2025FW黑粉色球衣-02.jpg",
//           "2025FW黑粉色球衣-03.jpg",
//           "2025FW黑粉色球衣-04.jpg",
//           "2025FW黑粉色球衣-05.jpg",
//           "2025FW黑粉色球衣-06.jpg",
//           "2025FW黑粉色球衣-07.jpg"
//         ],
//         sizes: [
//           { label: "1", stock: 13 },
//           { label: "2", stock: 18 }
//         ]
//       },
//       {
//         "color": "White Blue",
//         "colorCode": "#FFFFFF",
//         "imageFiles": [
//           "2025FW白藍色球衣-01.jpg",
//           "2025FW白藍色球衣-02.jpg",
//           "2025FW白藍色球衣-03.jpg",
//           "2025FW白藍色球衣-04.jpg",
//           "2025FW白藍色球衣-05.jpg",
//           "2025FW白藍色球衣-06.jpg",
//           "2025FW白藍色球衣-07.jpg"
//         ],
//         sizes: [
//           { label: "1", stock: 15 },
//           { label: "2", stock: 15 }
//         ]
//       }
//     ]
//   },
//   {
//     "slug": "Womens-BodySuit",
//     "title": "Womens BodySuit",
//     "price": 1680,
//     "year": 2025,
//     "season": "FW",
//     "description": `
//  * Bodysuit <br>
// * Metal Logo Tag <br>
// * 100% Cotton<br>
// <br>
// * 連體衣版型<br>
// * 金屬Logo<br>
// * 100% 棉材質<br>
// <br>
// * Size 1<br>
// 胸圍 Chest - 36cm<br>
// 腰圍 Waist - 30cm<br>
// 袖長 Sleeve - 65cm<br>
// <br>
// * Size 2<br>
// 胸圍 Chest - 38cm<br>
// 腰圍 Waist - 32cm<br>
// 袖長 Sleeve - 69cm<br>
// <br>
// * 尺寸皆為商品平量數據 單位皆為公分 *<br>
// * Measurements are all in centimeters *<br>
// <br>
// * 陸續在各路經銷商上架<br>
// * Soon will be available at selected retail stores`,
//     "variants": [
//       {
//         "color": "Black",
//         "colorCode": "#000000",
//         "imageFiles": [
//           "2025FW黑色連體衣-01.png",
//           "2025FW黑色連體衣-02.png",
//           "2025FW黑色連體衣-03.png",
//           "2025FW黑色連體衣-04.png",
//           "2025FW黑色連體衣-05.png"
//         ],
//         sizes: [
//           { label: "0", stock: 19 },
//           { label: "1", stock: 17 }
//         ]
//       },
//       {
//         "color": "Cream White",
//         "colorCode": "#FFFFFF",
//         "imageFiles": [
//           "2025FW白色連體衣-01.png",
//           "2025FW白色連體衣-02.png",
//           "2025FW白色連體衣-03.png",
//           "2025FW白色連體衣-04.png",
//           "2025FW白色連體衣-05.png"
//         ],
//         sizes: [
//           { label: "1", stock: 24 },
//           { label: "2", stock: 21 }
//         ]
//       }
//     ]
//   },
  {
    "slug": "OverLock-Hoodie",
    "title": "OverLock Hoodie",
    "price": 2980,
    "year": 2025,
    "season": "FW",
    "description": `
 * Boxy fit <br>
* OverLock Stitch <br>
* Metal Logo Tag <br>
* 100% Cotton<br>
<br>
* 短寬版型<br>
* 外縫線設計<br>
* 金屬Logo<br>
* 100% 棉材質<br>
<br>
* Size 1<br>
胸圍 Chest - 60cm<br>
衣長 Length - 62cm<br>
連肩袖長 Shoulder Sleeve - 70cm<br>
<br>
* Size 2<br>
胸圍 Chest - 62cm<br>
衣長 Length - 64cm<br>
連肩袖長 Shoulder Sleeve - 71cm<br>
<br>
* Size 3<br>
胸圍 Chest - 64cm<br>
衣長 Length - 66cm<br>
連肩袖長 Shoulder Sleeve - 72cm<br>
<br>
* 尺寸皆為商品平量數據 單位皆為公分 *<br>
* Measurements are all in centimeters *`,
    "variants": [
      {
        "color": "Black",
        "colorCode": "#000000",
        "imageFiles": [
          "2025FW黑色帽衫-01.png",
          "2025FW黑色帽衫-02.png",
          "2025FW黑色帽衫-03.png",
          "2025FW黑色帽衫-04.png",
          "2025FW黑色帽衫-05.png"
        ],
        sizes: [
          { label: "1", stock: 12 },
          { label: "2", stock: 14 },
          { label: "3", stock: 11 }
        ]
      },
      {
        "color": "BabyBlue",
        "colorCode": "#ccd5fc",
        "imageFiles": [
          "2025FW藍色帽衫-01.png",
          "2025FW藍色帽衫-02.png",
          "2025FW藍色帽衫-03.png",
          "2025FW藍色帽衫-04.png",
          "2025FW藍色帽衫-05.png"
        ],
        sizes: [
          { label: "1", stock: 12 },
          { label: "2", stock: 13 },
          { label: "3", stock: 11 }
        ]
      },
      {
        "color": "Pink",
        "colorCode": "#ffd1dc",
        "imageFiles": [
          "2025FW粉色帽衫-01.png",
          "2025FW粉色帽衫-02.png",
          "2025FW粉色帽衫-03.png",
          "2025FW粉色帽衫-04.png",
          "2025FW粉色帽衫-05.png"
        ],
        sizes: [
          { label: "1", stock: 17 },
          { label: "2", stock: 19 },
          { label: "3", stock: 10 }
        ]
      }
    ]
  }
  // 之後要再加其他商品就繼續往下加
];

module.exports = { productDefs }