-- DropForeignKey
ALTER TABLE "BusinessConfig" DROP CONSTRAINT "BusinessConfig_actualizadoPorId_fkey";

-- AlterTable
ALTER TABLE "BusinessConfig" ALTER COLUMN "actualizadoPorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "BusinessConfig" ADD CONSTRAINT "BusinessConfig_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
