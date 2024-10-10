/*
  Warnings:

  - You are about to drop the column `insurancePlanId` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the `InsurancePlan` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `insuranceCompanyId` to the `Patient` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "InsurancePlan" DROP CONSTRAINT "InsurancePlan_insuranceCompanyId_fkey";

-- DropForeignKey
ALTER TABLE "Patient" DROP CONSTRAINT "Patient_insurancePlanId_fkey";

-- AlterTable
ALTER TABLE "Patient" DROP COLUMN "insurancePlanId",
ADD COLUMN     "insuranceCompanyId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "InsurancePlan";

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_insuranceCompanyId_fkey" FOREIGN KEY ("insuranceCompanyId") REFERENCES "InsuranceCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
