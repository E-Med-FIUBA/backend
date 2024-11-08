/*
  Warnings:

  - You are about to drop the column `prescriptionNodeQueueId` on the `Prescription` table. All the data in the column will be lost.
  - You are about to drop the column `prescriptionNodeStagingId` on the `Prescription` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[prescriptionId]` on the table `PrescriptionNodeQueue` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[prescriptionId]` on the table `PrescriptionNodeStaging` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `prescriptionId` to the `PrescriptionNodeQueue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prescriptionId` to the `PrescriptionNodeStaging` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Prescription" DROP CONSTRAINT "Prescription_prescriptionNodeQueueId_fkey";

-- DropForeignKey
ALTER TABLE "Prescription" DROP CONSTRAINT "Prescription_prescriptionNodeStagingId_fkey";

-- DropIndex
DROP INDEX "Prescription_prescriptionNodeQueueId_key";

-- DropIndex
DROP INDEX "Prescription_prescriptionNodeStagingId_key";

-- AlterTable
ALTER TABLE "Prescription" DROP COLUMN "prescriptionNodeQueueId",
DROP COLUMN "prescriptionNodeStagingId";

-- AlterTable
ALTER TABLE "PrescriptionNodeQueue" ADD COLUMN     "prescriptionId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "PrescriptionNodeStaging" ADD COLUMN     "prescriptionId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PrescriptionNodeQueue_prescriptionId_key" ON "PrescriptionNodeQueue"("prescriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "PrescriptionNodeStaging_prescriptionId_key" ON "PrescriptionNodeStaging"("prescriptionId");

-- AddForeignKey
ALTER TABLE "PrescriptionNodeStaging" ADD CONSTRAINT "PrescriptionNodeStaging_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionNodeQueue" ADD CONSTRAINT "PrescriptionNodeQueue_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
