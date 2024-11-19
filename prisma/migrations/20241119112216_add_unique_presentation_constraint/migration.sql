/*
  Warnings:

  - A unique constraint covering the columns `[name,administration,commercialName,drugId]` on the table `Presentation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Presentation_name_administration_commercialName_drugId_key" ON "Presentation"("name", "administration", "commercialName", "drugId");
