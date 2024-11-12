-- CreateTable
CREATE TABLE "DoctorNodeQueue" (
    "id" SERIAL NOT NULL,
    "transactionHash" TEXT,
    "doctorId" INTEGER NOT NULL,
    "isRegeneration" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DoctorNodeQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DoctorNodeQueue_doctorId_key" ON "DoctorNodeQueue"("doctorId");

-- AddForeignKey
ALTER TABLE "DoctorNodeQueue" ADD CONSTRAINT "DoctorNodeQueue_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
