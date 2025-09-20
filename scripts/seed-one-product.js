require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const title = "Tight Fit Tee"
  const productData = {
    title,
    price: 1680,
    year: 2025,          // 👈 你的年分
    season: 'SS',        // 👈 'SS' | 'FW'
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
  }

  // 關聯資料（variants + sizes）集中定義，方便重建
  const variantsToCreate = [
    {
      color: "white",
      colorCode: "#FFFFFF",
      thumbnails: [
        "https://eal-testing-bucket.s3.ap-northeast-3.amazonaws.com/images/25ss_white.jpg",
        "https://eal-testing-bucket.s3.ap-northeast-3.amazonaws.com/images/25ss_white_back.jpg"
      ],
      sizes: {
        create: [
          { label: "1", stock: 10 },
          { label: "2", stock: 6 },
          { label: "3", stock: 6 },
        ],
      },
    },
    {
      color: "Black",
      colorCode: "#000000",
      thumbnails: [
        "https://eal-testing-bucket.s3.ap-northeast-3.amazonaws.com/images/25ss_black.jpg",
        "https://eal-testing-bucket.s3.ap-northeast-3.amazonaws.com/images/25ss_black_back.jpg"
      ],
      sizes: {
        create: [
          { label: "1", stock: 10 },
          { label: "2", stock: 6 },
          { label: "3", stock: 6 },
        ],
      },
    },
  ]

  // 判斷是否存在（以 title 當唯一識別；也可換成自定唯一鍵）
  const existing = await prisma.product.findFirst({ where: { title } })

  let product
  if (!existing) {
    // 第一次：直接建立含關聯
    product = await prisma.product.create({
      data: {
        ...productData,
        variants: { create: variantsToCreate },
      },
      include: { variants: { include: { sizes: true } } },
    })
    console.log('✅ Seeded (created):', product.title, product.id)
  } else {
    // 已存在：更新主檔，重建關聯（先刪 sizes → 再刪 variants → 再 create）
    await prisma.size.deleteMany({
      where: { variant: { productId: existing.id } },
    })
    await prisma.variant.deleteMany({
      where: { productId: existing.id },
    })

    product = await prisma.product.update({
      where: { id: existing.id },
      data: {
        ...productData,
        variants: { create: variantsToCreate },
      },
      include: { variants: { include: { sizes: true } } },
    })
    console.log('✅ Seeded (updated):', product.title, product.id)
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1) })