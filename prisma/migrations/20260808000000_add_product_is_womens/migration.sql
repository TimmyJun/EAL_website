-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN "isWomens" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Product_isWomens_idx" ON "public"."Product"("isWomens");
