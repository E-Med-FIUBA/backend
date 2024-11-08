/*
  Warnings:

  - A unique constraint covering the columns `[prescriptionNodeQueueId]` on the table `Prescription` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[prescriptionNodeStagingId]` on the table `Prescription` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Prescription" ADD COLUMN     "prescriptionNodeQueueId" INTEGER,
ADD COLUMN     "prescriptionNodeStagingId" INTEGER;

-- CreateTable
CREATE TABLE "PrescriptionNodeStaging" (
    "id" SERIAL NOT NULL,
    "parent_id" INTEGER,
    "side" "ChildSide",
    "hash" TEXT NOT NULL,

    CONSTRAINT "PrescriptionNodeStaging_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionNodeQueue" (
    "id" SERIAL NOT NULL,
    "transactionHash" TEXT NOT NULL,

    CONSTRAINT "PrescriptionNodeQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrescriptionNodeStaging_parent_id_side_key" ON "PrescriptionNodeStaging"("parent_id", "side");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_prescriptionNodeQueueId_key" ON "Prescription"("prescriptionNodeQueueId");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_prescriptionNodeStagingId_key" ON "Prescription"("prescriptionNodeStagingId");

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_prescriptionNodeStagingId_fkey" FOREIGN KEY ("prescriptionNodeStagingId") REFERENCES "PrescriptionNodeStaging"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_prescriptionNodeQueueId_fkey" FOREIGN KEY ("prescriptionNodeQueueId") REFERENCES "PrescriptionNodeQueue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionNodeStaging" ADD CONSTRAINT "PrescriptionNodeStaging_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "PrescriptionNodeStaging"("id") ON DELETE SET NULL ON UPDATE CASCADE;
