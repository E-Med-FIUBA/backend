-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "privateKey" TEXT,
ALTER COLUMN "certificate" DROP NOT NULL;
