-- CreateTable
CREATE TABLE "PrescriptionNode" (
    "id" SERIAL NOT NULL,
    "parent_id" INTEGER,
    "hash" TEXT NOT NULL,
    "key" INTEGER,

    CONSTRAINT "PrescriptionNode_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PrescriptionNode" ADD CONSTRAINT "PrescriptionNode_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "PrescriptionNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionNode" ADD CONSTRAINT "PrescriptionNode_key_fkey" FOREIGN KEY ("key") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
