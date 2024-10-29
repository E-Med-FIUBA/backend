/*
  Warnings:

  - You are about to drop the column `drugId` on the `Prescription` table. All the data in the column will be lost.
  - Added the required column `presentationId` to the `Prescription` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Prescription" DROP CONSTRAINT "Prescription_drugId_fkey";

-- AlterTable
ALTER TABLE "Prescription" DROP COLUMN "drugId",
ADD COLUMN     "presentationId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Presentation" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "drugId" INTEGER NOT NULL,

    CONSTRAINT "Presentation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Presentation" ADD CONSTRAINT "Presentation_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "Presentation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
