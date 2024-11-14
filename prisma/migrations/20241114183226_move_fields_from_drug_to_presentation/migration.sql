/*
  Warnings:

  - You are about to drop the column `administration` on the `Drug` table. All the data in the column will be lost.
  - You are about to drop the column `commercial_name` on the `Drug` table. All the data in the column will be lost.
  - You are about to drop the column `form` on the `Drug` table. All the data in the column will be lost.
  - Added the required column `administration` to the `Presentation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `commercial_name` to the `Presentation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `form` to the `Presentation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Drug" DROP COLUMN "administration",
DROP COLUMN "commercial_name",
DROP COLUMN "form";

-- AlterTable
ALTER TABLE "Presentation" ADD COLUMN     "administration" TEXT NOT NULL,
ADD COLUMN     "commercial_name" TEXT NOT NULL,
ADD COLUMN     "form" TEXT NOT NULL;
