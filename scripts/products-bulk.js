const productDefs = [
  {
    slug: "Heritage-Flannel-Long-Shirt",          
    title: "Heritage Flannel Long Shirt",         
    price: 2480,                           
    year: 2026,            
    season: "SS",                         
    isArchived: false,
    description: `* Clean fit <br>
* Flannel Shirt <br>
* Script words print<br>
<br>
* 完美版型<br>
* 長袖襯衫<br>
* 草寫Logo文字印花<br>
<br>
* Size 1<br>
胸圍 Chest - 60cm<br>
衣長 Length - 68cm<br>
袖長 Sleeve - 68cm<br>
<br>
* Size 2<br>
胸圍 Chest - 62cm<br>
衣長 Length - 72cm<br>
袖長 Sleeve - 69cm<br>
<br>
* Size 3<br>
胸圍 Chest - 64cm<br>
衣長 Length - 74cm<br>
袖長 Sleeve - 70cm<br>
<br>
* 尺寸皆為商品平量數據 單位皆為公分 *<br>
* Measurements are all in centimeters *`,
    variants: [
      {
        color: "Brown",                   
        colorCode: "#584949",           
        imageFiles: [                    
          "2026ss格紋襯衫-01.png",
          "2026ss格紋襯衫-02.png",
          "2026ss格紋襯衫-03.png",
          "2026ss格紋襯衫-04.png",
          "2026ss格紋襯衫-05.png",
          "2026ss格紋襯衫-06.png",
          "2026ss格紋襯衫-07.png",
          "2026ss格紋襯衫-08.png",
          "尺寸數據2.png",
        ],
        sizes: [
          { label: "1", stock: 10 },       
          { label: "2", stock: 10 },
          { label: "3", stock: 10 }
        ]
      }
    ]
  }
];

module.exports = { productDefs }