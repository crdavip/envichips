import { z } from "zod";

// ─── ENUMS ─────────────────────────────────────────
// Match Prisma enums exactly (lib/generated/prisma/enums.ts)

export const CategoriaEnum = z.enum([
  "PAPA",
  "PLATANO",
  "MADURO",
  "CHICHARRON",
  "ROSQUITA",
  "ROSCA",
  "DETODITO",
  "ARITOS",
  "OTRO",
]);

export const PresentacionEnum = z.enum([
  "G50",
  "G65",
  "G250",
  "G500",
  "OTRO",
]);

export const MetodoPagoEnum = z.enum([
  "EFECTIVO",
  "TRANSFERENCIA",
  "FIADO",
]);

// ─── SCHEMAS ───────────────────────────────────────

// Base schema without refine — needed for partial() to work
const articuloBaseSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").max(100),
  categoria: CategoriaEnum,
  presentacion: PresentacionEnum,
  costo: z.number().int().positive("El costo debe ser mayor a 0"),
  precio: z.number().int().positive("El precio debe ser mayor a 0"),
  stockMinimo: z
    .number()
    .int()
    .min(0, "El stock mínimo no puede ser negativo")
    .default(0),
});

export const createArticuloSchema = articuloBaseSchema.refine(
  (data) => data.precio > data.costo,
  {
    message: "El precio debe ser mayor al costo",
    path: ["precio"],
  },
);

export const updateArticuloSchema = articuloBaseSchema.partial();

export const purchaseItemSchema = z.object({
  articuloId: z.string().uuid(),
  cantidad: z.number().int().positive("La cantidad debe ser mayor a 0"),
  costo: z.number().int().positive(),
  subtotal: z.number().int().positive(),
});

export const registerPurchaseSchema = z.object({
  fecha: z.string().datetime().optional(),
  proveedor: z.string().min(1, "El proveedor es requerido").max(200),
  metodoPago: MetodoPagoEnum,
  items: z
    .array(purchaseItemSchema)
    .min(1, "Debe incluir al menos un artículo"),
  observaciones: z.string().max(500).optional(),
});

// ─── OUTPUT TYPES ──────────────────────────────────

export type CreateArticuloInput = z.output<typeof createArticuloSchema>;
export type UpdateArticuloInput = z.output<typeof updateArticuloSchema>;
export type RegisterPurchaseInput = z.output<typeof registerPurchaseSchema>;
