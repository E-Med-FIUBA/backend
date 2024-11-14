/*
  Warnings:

  - You are about to drop the column `commercial_name` on the `Presentation` table. All the data in the column will be lost.
  - Added the required column `commercialName` to the `Presentation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Presentation" DROP COLUMN "commercial_name",
ADD COLUMN     "commercialName" TEXT NOT NULL;
