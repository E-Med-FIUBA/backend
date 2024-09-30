-- CreateEnum
CREATE TYPE "ChildSide" AS ENUM ('LEFT', 'RIGHT');

-- AlterTable
ALTER TABLE "PrescriptionNode" ADD COLUMN     "side" "ChildSide";
