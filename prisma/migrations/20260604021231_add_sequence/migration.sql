-- CreateTable
CREATE TABLE "Sequence" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Sequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sequence_year_type_key" ON "Sequence"("year", "type");

-- AddForeignKey
ALTER TABLE "HistorialEstado" ADD CONSTRAINT "HistorialEstado_cambiadoPorId_fkey" FOREIGN KEY ("cambiadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
