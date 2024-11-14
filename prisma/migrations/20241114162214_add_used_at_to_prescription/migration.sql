/*
  Warnings:

  - Added the required column `usedAt` to the `Prescription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Prescription" ADD COLUMN     "usedAt" TIMESTAMP(3) NOT NULL;
