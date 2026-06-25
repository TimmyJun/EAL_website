-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Product_isArchived_idx" ON "public"."Product"("isArchived");
