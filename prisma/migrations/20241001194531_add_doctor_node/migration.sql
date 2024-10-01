-- CreateTable
CREATE TABLE "DoctorNode" (
    "id" SERIAL NOT NULL,
    "parent_id" INTEGER,
    "side" "ChildSide",
    "hash" TEXT NOT NULL,
    "key" INTEGER,

    CONSTRAINT "DoctorNode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DoctorNode_parent_id_side_key" ON "DoctorNode"("parent_id", "side");

-- AddForeignKey
ALTER TABLE "DoctorNode" ADD CONSTRAINT "DoctorNode_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "DoctorNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorNode" ADD CONSTRAINT "DoctorNode_key_fkey" FOREIGN KEY ("key") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
