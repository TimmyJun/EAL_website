-- CreateEnum
CREATE TYPE "public"."Season" AS ENUM ('SS', 'FW');

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "season" "public"."Season",
ADD COLUMN     "year" INTEGER;

-- CreateIndex
CREATE INDEX "Product_year_season_idx" ON "public"."Product"("year", "season");
