/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `InsuranceCompany` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `InsuranceCompany` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InsuranceCompany" ADD COLUMN     "code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceCompany_code_key" ON "InsuranceCompany"("code");
