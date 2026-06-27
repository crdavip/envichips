-- CreateTable
CREATE TABLE "RegistroVisita" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notas" TEXT,

    CONSTRAINT "RegistroVisita_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegistroVisita_clienteId_fecha_idx" ON "RegistroVisita"("clienteId", "fecha");

-- AddForeignKey
ALTER TABLE "RegistroVisita" ADD CONSTRAINT "RegistroVisita_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroVisita" ADD CONSTRAINT "RegistroVisita_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
