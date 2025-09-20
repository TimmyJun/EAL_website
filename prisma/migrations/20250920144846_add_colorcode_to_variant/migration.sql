/*
  Warnings:

  - A unique constraint covering the columns `[productId,colorCode]` on the table `Variant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `colorCode` to the `Variant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Variant" ADD COLUMN     "colorCode" VARCHAR(7) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Variant_productId_colorCode_key" ON "public"."Variant"("productId", "colorCode");
