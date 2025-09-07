require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const product = await prisma.product.create({
    data: {
      title: "Tight Fit Tee",
      price: 1680,
      description: `* Tight fit <br>
* Logo metal tag <br>
* 100% Cotton <br>
<br>
* 合身正肩的版型<br>
* Logo金屬標<br>
* 100% 棉材質<br><br>

* Size 1 <br>
胸圍 Chest - 100m <br>
衣長 Length - 64cm <br>
肩寬 Shoulder - 41cm <br>
袖長 Sleeve - 18cm <br><br>

* Size 2<br>
胸圍 Chest - 104cm <br>
衣長 Length - 66cm <br>
肩寬 Shoulder - 42cm <br>
袖長 Sleeve - 18cm <br><br>

* Size 3<br>
胸圍 Chest - 110cm<br>
衣長 Length - 68cm<br>
肩寬 Shoulder - 44cm<br>
袖長 Sleeve - 20cm<br>`,
      variants: {
        create: [
          {
            color: "white",
            thumbnails: [
              "https://eal-testing-bucket.s3.ap-northeast-3.amazonaws.com/images/25ss_white.jpg",
              "https://eal-testing-bucket.s3.ap-northeast-3.amazonaws.com/images/25ss_white_back.jpg"
            ],
            sizes: {
              create: [
                { label: "1", stock: 10 },
                { label: "2", stock: 6 },
                { label: "3", stock: 6 }
              ]
            }
          },
          {
            color: "Black",
            thumbnails: [
              "https://eal-testing-bucket.s3.ap-northeast-3.amazonaws.com/images/25ss_black.jpg",
              "https://eal-testing-bucket.s3.ap-northeast-3.amazonaws.com/images/25ss_black_back.jpg"
            ],
            sizes: {
              create: [
                { label: "1", stock: 10 },
                { label: "2", stock: 6 },
                { label: "3", stock: 6 }
              ]
            }
          }
        ]
      }
    },
    include: { variants: { include: { sizes: true } } }
  })

  console.log('✅ Seeded product:', product.title, product.id)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
