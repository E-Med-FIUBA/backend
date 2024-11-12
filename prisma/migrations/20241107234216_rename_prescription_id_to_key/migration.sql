/*
  Warnings:

  - You are about to drop the column `prescriptionId` on the `PrescriptionNodeStaging` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[key]` on the table `PrescriptionNodeStaging` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `key` to the `PrescriptionNodeStaging` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PrescriptionNodeStaging" DROP CONSTRAINT "PrescriptionNodeStaging_prescriptionId_fkey";

-- DropIndex
DROP INDEX "PrescriptionNodeStaging_prescriptionId_key";

-- AlterTable
ALTER TABLE "PrescriptionNodeStaging" DROP COLUMN "prescriptionId",
ADD COLUMN     "key" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PrescriptionNodeStaging_key_key" ON "PrescriptionNodeStaging"("key");

-- AddForeignKey
ALTER TABLE "PrescriptionNodeStaging" ADD CONSTRAINT "PrescriptionNodeStaging_key_fkey" FOREIGN KEY ("key") REFERENCES "Prescription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
