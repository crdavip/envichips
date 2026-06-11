-- CreateEnum
CREATE TYPE "EstadoCobro" AS ENUM ('PENDIENTE', 'COBRADO_PARCIAL', 'COBRADO');

-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "estadoCobro" "EstadoCobro" NOT NULL DEFAULT 'PENDIENTE';
