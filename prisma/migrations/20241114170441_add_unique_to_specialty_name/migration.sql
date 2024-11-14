/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Specialty` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Specialty_name_key" ON "Specialty"("name");
