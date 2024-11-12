/*
  Warnings:

  - You are about to drop the `PrescriptionNodeStaging` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PrescriptionNodeStaging" DROP CONSTRAINT "PrescriptionNodeStaging_key_fkey";

-- DropForeignKey
ALTER TABLE "PrescriptionNodeStaging" DROP CONSTRAINT "PrescriptionNodeStaging_parent_id_fkey";

-- DropTable
DROP TABLE "PrescriptionNodeStaging";
