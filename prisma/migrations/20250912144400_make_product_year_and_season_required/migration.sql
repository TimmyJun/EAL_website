/*
  Warnings:

  - Made the column `season` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `year` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Product" ALTER COLUMN "season" SET NOT NULL,
ALTER COLUMN "year" SET NOT NULL;
