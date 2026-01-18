const productDefs = [
  {
    slug: "break-down-sweatshirt",
    title: "Break Down Sweatshirt",
    price: 2080,
    year: 2025,
    season: "AW",
    description: `* Boxy fit<br>
* Destroyed and faded detail everywhere<br>
* Metal Logo Tag<br>
* 100% Cotton<br>
<br>
* 短寬版型<br>
* 整體破壞水洗做舊<br>
* 金屬 Logo<br>
* 100% 棉材質<br>
<br>
* Size 1<br>
胸圍 Chest - 52cm<br>
衣長 Length - 50cm<br>
袖長 Sleeve - 70cm<br>
<br>
* Size 2<br>
胸圍 Chest - 55cm<br>
衣長 Length - 55cm<br>
袖長 Sleeve - 73cm<br>
<br>
* Size 3<br>
胸圍 Chest - 58cm<br>
衣長 Length - 60cm<br>
袖長 Sleeve - 76cm<br>
<br>
* 尺寸皆為商品平量數據，單位皆為公分 *<br>
* Measurements are all in centimeters *
`,
    variants: [
      {
        color: "Faded Black",
        colorCode: "#111111",
        imageFiles: [
          "black-1.jpg",
          "black-2.jpg",
          "black-3.jpg",
          "black-4.jpg",
          "black-5.jpg",
        ],
        sizes: [
          { label: "1", stock: 9 },
          { label: "2", stock: 9 },
          { label: "3", stock: 9 }
        ]
      },
      {
        color: "Faded Blue",
        colorCode: "#090C4F",
        imageFiles: [
          "blue-1.jpg",
          "blue-2.jpg",
          "blue-3.jpg",
          "blue-4.jpg",
          "blue-5.jpg",
        ],
        sizes: [
          { label: "1", stock: 9 },
          { label: "2", stock: 9 },
          { label: "3", stock: 9 }
        ]
      }
    ]
  }

  // 之後要再加其他商品就繼續往下加
];

module.exports = { productDefs }