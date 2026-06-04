import { z } from "zod";
import { MetodoPagoEnum } from "./articulos";

// ─── ENUMS ─────────────────────────────────────────
// Match Prisma enums exactly (lib/generated/prisma/enums.ts)

export const TipoDocEnum = z.enum([
  "CC",
  "TI",
  "CE",
  "NIT",
  "PASAPORTE",
]);

// ─── SCHEMAS ───────────────────────────────────────

export const createClienteSchema = z.object({
  nombreCompleto: z
    .string()
    .min(1, "El nombre es requerido")
    .max(200),
  telefono: z.string().max(20).optional(),
  direccion: z.string().max(200).optional(),
  tipoDoc: TipoDocEnum.optional(),
  numeroDoc: z.string().max(50).optional(),
  limiteCredito: z
    .number()
    .int()
    .nonnegative("El límite de crédito no puede ser negativo")
    .optional()
    .default(0),
});

export const updateClienteSchema = createClienteSchema.partial();

export const registerAbonoSchema = z.object({
  clienteId: z.string().uuid("ID de cliente inválido"),
  monto: z
    .number()
    .int()
    .positive("El monto debe ser mayor a 0"),
  metodoPago: MetodoPagoEnum,
  notas: z.string().max(500).optional(),
});

// ─── OUTPUT TYPES ──────────────────────────────────

export type CreateClienteInput = z.output<typeof createClienteSchema>;
export type UpdateClienteInput = z.output<typeof updateClienteSchema>;
export type RegisterAbonoInput = z.output<typeof registerAbonoSchema>;
