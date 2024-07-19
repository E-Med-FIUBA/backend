/*
  Warnings:

  - You are about to drop the column `certification` on the `Doctor` table. All the data in the column will be lost.
  - You are about to drop the column `certification` on the `Pharmacist` table. All the data in the column will be lost.
  - You are about to drop the column `birthDate` on the `User` table. All the data in the column will be lost.
  - Added the required column `license` to the `Doctor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `specialty` to the `Doctor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `birthDate` to the `Patient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `license` to the `Pharmacist` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Doctor" DROP COLUMN "certification",
ADD COLUMN     "license" TEXT NOT NULL,
ADD COLUMN     "specialty" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "birthDate" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Pharmacist" DROP COLUMN "certification",
ADD COLUMN     "license" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "birthDate";
