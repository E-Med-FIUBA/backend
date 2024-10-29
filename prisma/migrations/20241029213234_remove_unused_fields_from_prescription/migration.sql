/*
  Warnings:

  - You are about to drop the column `duration` on the `Prescription` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `Prescription` table. All the data in the column will be lost.
  - You are about to drop the column `frequency` on the `Prescription` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Prescription` table. All the data in the column will be lost.
  - Added the required column `emitedAt` to the `Prescription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Prescription" DROP COLUMN "duration",
DROP COLUMN "endDate",
DROP COLUMN "frequency",
DROP COLUMN "startDate",
ADD COLUMN     "emitedAt" TIMESTAMP(3) NOT NULL;
