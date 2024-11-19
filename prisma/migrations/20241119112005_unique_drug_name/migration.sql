/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Drug` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Drug_name_key" ON "Drug"("name");
