/*
  Warnings:

  - Added the required column `certificate` to the `Doctor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `certificateRequest` to the `Doctor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `signature` to the `Prescription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "certificate" TEXT NOT NULL,
ADD COLUMN     "certificateRequest" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Prescription" ADD COLUMN     "signature" TEXT NOT NULL;
