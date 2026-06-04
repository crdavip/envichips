-- AlterTable
ALTER TABLE "Movimiento" ADD COLUMN     "eliminado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "eliminadoEn" TIMESTAMP(3),
ADD COLUMN     "eliminadoPorId" TEXT,
ADD COLUMN     "motivoEliminacion" TEXT;
