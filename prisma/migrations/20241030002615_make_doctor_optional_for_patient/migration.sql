-- DropForeignKey
ALTER TABLE "Patient" DROP CONSTRAINT "Patient_doctorId_fkey";

-- AlterTable
ALTER TABLE "Patient" ALTER COLUMN "doctorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
