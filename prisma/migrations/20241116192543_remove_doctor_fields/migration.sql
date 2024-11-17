/*
  Warnings:

  - You are about to drop the column `certificateRequest` on the `Doctor` table. All the data in the column will be lost.
  - You are about to drop the column `iv` on the `Doctor` table. All the data in the column will be lost.
  - You are about to drop the column `privateKey` on the `Doctor` table. All the data in the column will be lost.
  - You are about to drop the column `salt` on the `Doctor` table. All the data in the column will be lost.
  - Made the column `certificate` on table `Doctor` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Doctor" DROP COLUMN "certificateRequest",
DROP COLUMN "iv",
DROP COLUMN "privateKey",
DROP COLUMN "salt",
ALTER COLUMN "certificate" SET NOT NULL;
