/*
  Warnings:

  - Added the required column `precioOriginal` to the `PedidoItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoDescuento" AS ENUM ('NINGUNO', 'GLOBAL', 'ESPECIAL');

-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "tipoDescuento" "TipoDescuento" NOT NULL DEFAULT 'NINGUNO';

-- Backfill existing pedidos (tipoDescuento)
UPDATE "Pedido" SET "tipoDescuento" = 'GLOBAL' WHERE "descuento" > 0;
UPDATE "Pedido" SET "tipoDescuento" = 'NINGUNO' WHERE "descuento" = 0;

-- AlterTable (add column first, then backfill, then add NOT NULL)
ALTER TABLE "PedidoItem" ADD COLUMN     "precioOriginal" INTEGER;

-- Backfill existing pedido items
UPDATE "PedidoItem" SET "precioOriginal" = "precio" WHERE "precioOriginal" IS NULL;

-- Now make it required
ALTER TABLE "PedidoItem" ALTER COLUMN "precioOriginal" SET NOT NULL;
