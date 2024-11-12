/*
  Warnings:

  - Added the required column `administration` to the `Drug` table without a default value. This is not possible if the table is not empty.
  - Added the required column `atc` to the `Drug` table without a default value. This is not possible if the table is not empty.
  - Added the required column `commercial_name` to the `Drug` table without a default value. This is not possible if the table is not empty.
  - Added the required column `form` to the `Drug` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Drug" ADD COLUMN     "administration" TEXT NOT NULL,
ADD COLUMN     "atc" TEXT NOT NULL,
ADD COLUMN     "commercial_name" TEXT NOT NULL,
ADD COLUMN     "form" TEXT NOT NULL;
