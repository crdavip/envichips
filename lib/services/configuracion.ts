import { db } from "@/lib/db";

export interface BusinessConfigData {
  id: string;
  nombreNegocio: string;
  telefonoFactura: string | null;
  actualizadoEn: Date;
  actualizadoPorId: string;
}

export async function getConfig(): Promise<BusinessConfigData> {
  let config = await db.businessConfig.findFirst();
  if (!config) {
    config = await db.businessConfig.create({
      data: {
        nombreNegocio: "Mi Negocio",
        actualizadoPorId: "", // will be set by first real user
      },
    });
  }
  return config;
}

export async function upsertConfig(
  data: { nombreNegocio: string; telefonoFactura?: string },
  userId: string,
): Promise<BusinessConfigData> {
  const existing = await db.businessConfig.findFirst();
  if (existing) {
    return db.businessConfig.update({
      where: { id: existing.id },
      data: {
        nombreNegocio: data.nombreNegocio,
        telefonoFactura: data.telefonoFactura ?? null,
        actualizadoPorId: userId,
      },
    });
  }
  return db.businessConfig.create({
    data: {
      nombreNegocio: data.nombreNegocio,
      telefonoFactura: data.telefonoFactura ?? null,
      actualizadoPorId: userId,
    },
  });
}
