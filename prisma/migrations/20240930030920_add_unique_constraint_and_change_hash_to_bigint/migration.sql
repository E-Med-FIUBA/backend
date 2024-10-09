/*
  Warnings:

  - A unique constraint covering the columns `[parent_id,side]` on the table `PrescriptionNode` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `hash` on the `PrescriptionNode` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "PrescriptionNode" DROP COLUMN "hash",
ADD COLUMN     "hash" BIGINT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PrescriptionNode_parent_id_side_key" ON "PrescriptionNode"("parent_id", "side");
