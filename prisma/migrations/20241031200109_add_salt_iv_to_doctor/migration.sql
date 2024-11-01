/*
  Warnings:

  - Added the required column `iv` to the `Doctor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `salt` to the `Doctor` table without a default value. This is not possible if the table is not empty.
  - Made the column `privateKey` on table `Doctor` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "iv" TEXT NOT NULL,
ADD COLUMN     "salt" TEXT NOT NULL,
ALTER COLUMN "privateKey" SET NOT NULL;
