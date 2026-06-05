import { z } from "zod";

export const configSchema = z.object({
  nombreNegocio: z.string().min(1, "El nombre del negocio es requerido"),
  telefonoFactura: z.string().optional(),
});

export type ConfigInput = z.output<typeof configSchema>;
