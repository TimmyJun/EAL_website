-- CreateTable
CREATE TABLE "public"."StockSnapshot" (
    "merchantTradeNo" TEXT NOT NULL,
    "itemsJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "StockSnapshot_pkey" PRIMARY KEY ("merchantTradeNo")
);
