const productDefs = [
  {
    slug: "removable-hood-zipperjacket",
    title: "Removable Hood Zipper Jacket",
    price: 2980,
    year: 2025,
    season: "AW",
    description: `* Boxy fit <br>
* Removable Hood also can be scarf <br>
* Metal Logo Tag <br>
* 100% Cotton<br>
<br>
* 短寬版型<br>
* 可拆卸帽子 也可以單獨作為帽子<br>
* 金屬Logo<br>
* 100% 棉材質<br>
<br>
* Size 1<br>
胸圍 Chest - 60cm<br>
衣長 Length - 50cm<br>
袖長 Sleeve -70cm<br>
<br>
* Size 2<br>
胸圍 Chest - 63cm<br>
衣長 Length - 55cm<br>
袖長 Sleeve -73cm<br>
<br>
* Size 3<br>
胸圍 Chest - 66cm<br>
衣長 Length - 60cm<br>
袖長 Sleeve -76cm<br>
<br>
* 尺寸皆為商品平量數據 單位皆為公分 *<br>
* Measurements are all in centimeters *`,
    variants: [
      {
        color: "Black Red",
        colorCode: "#111111",
        imageFiles: [
          "jacket-black-1.jpg",
          "jacket-black-2.jpg",
          "jacket-black-3.jpg",
          "jacket-black-4.jpg",
          "jacket-black-5.jpg",
          "jacket-black-6.jpg"
        ],
        sizes: [
          { label: "1", stock: 9 },
          { label: "2", stock: 9 },
          { label: "3", stock: 9 }
        ]
      },
      {
        color: "Grey Blue",
        colorCode: "#e5e5e5",
        imageFiles: [
          "jacket-white-1.jpg",
          "jacket-white-2.jpg",
          "jacket-white-3.jpg",
          "jacket-white-4.jpg",
          "jacket-white-5.jpg",
          "jacket-white-6.jpg"
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

module.exports = { productDefs };