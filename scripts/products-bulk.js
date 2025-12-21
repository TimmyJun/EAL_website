const productDefs = [
  {
    slug: "logo-man-short-cap",
    title: "ETREALOUEST LOGO-MAN SHORT CAP",
    price: 1380,
    year: 2025,
    season: "SS",
    description: `* Logo Man embroidery on the brim <br>
* Handwritten font embroidery on the back <br>
* Adjustable size <br>
* Damage effect<br>
<br>
* Logo Man刺繡在帽簷處<br>
* 手寫字體在背後<br>
* 可調節大小<br>
* 破壞效果`,
    variants: [
      {
        color: "Black",
        colorCode: "#111111",
        imageFiles: [
          "cap-photo-7.png"
        ],
        sizes: [
          { label: "1", stock: 9 }
        ]
      }
    ]
  }

  // 之後要再加其他商品就繼續往下加
];

module.exports = { productDefs };