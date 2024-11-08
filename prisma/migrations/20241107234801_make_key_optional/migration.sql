-- DropForeignKey
ALTER TABLE "PrescriptionNodeStaging" DROP CONSTRAINT "PrescriptionNodeStaging_key_fkey";

-- AlterTable
ALTER TABLE "PrescriptionNodeStaging" ALTER COLUMN "key" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "PrescriptionNodeStaging" ADD CONSTRAINT "PrescriptionNodeStaging_key_fkey" FOREIGN KEY ("key") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
