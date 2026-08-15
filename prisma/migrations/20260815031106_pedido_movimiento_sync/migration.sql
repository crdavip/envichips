-- AlterEnum
ALTER TYPE "CategoriaMovimiento" ADD VALUE 'VENTA_PEDIDO';

-- AlterTable
ALTER TABLE "Movimiento" ADD COLUMN     "pedidoId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Movimiento_pedidoId_key" ON "Movimiento"("pedidoId");

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE SET NULL ON UPDATE CASCADE;
