/*
  Warnings:

  - Added the required column `action` to the `PrescriptionNodeQueue` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "QueueAction" AS ENUM ('CREATE', 'UPDATE');

-- AlterTable
ALTER TABLE "PrescriptionNodeQueue" ADD COLUMN     "action" "QueueAction" NOT NULL;
