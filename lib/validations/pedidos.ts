import { z } from "zod";
import { MetodoPagoEnum } from "./articulos";

// ─── ENUMS ─────────────────────────────────────────
// Match Prisma enums exactly (lib/generated/prisma/enums.ts)

export const EstadoPedidoEnum = z.enum([
  "PENDIENTE",
  "EN_CAMINO",
  "ENTREGADO",
  "CANCELADO",
]);

export const EstadoCobroEnum = z.enum([
  "PENDIENTE",
  "COBRADO_PARCIAL",
  "COBRADO",
]);

// ─── SCHEMAS ───────────────────────────────────────

export const PedidoItemInput = z.object({
  articuloId: z.string().uuid("ID de artículo inválido"),
  cantidad: z.number().int().positive("La cantidad debe ser mayor a 0"),
});

export const createPedidoSchema = z.object({
  clienteId: z.string().uuid().optional(),
  clienteNombre: z.string().max(200).optional(), // venta rápida
  items: z
    .array(PedidoItemInput)
    .min(1, "Debe incluir al menos un producto"),
  metodoPago: MetodoPagoEnum,
  descuento: z.number().int().min(0).default(0).optional(),
  domiciliarioId: z.string().uuid().optional(), // null = venta directa
  observaciones: z.string().max(500).optional(),
  creadoPorId: z.string().uuid(),
});

export const updateEstadoSchema = z.object({
  estado: EstadoPedidoEnum,
  motivo: z.string().min(1, "El motivo es requerido").optional(),
  dineroCobrado: z.boolean().optional(),
  montoCobrado: z.number().int().min(0).optional(),
  cambiadoPorId: z.string().uuid().optional(),
});

export const cancelarPedidoSchema = z.object({
  motivo: z.string().min(1, "El motivo es requerido"),
  cambiadoPorId: z.string().uuid(),
});

export const confirmarCobroSchema = z.object({
  pedidoId: z.string().uuid(),
});

export const asignarDomiciliarioSchema = z.object({
  domiciliarioId: z.string().uuid().nullable(),
});

export const modificarPedidoSchema = z.object({
  items: z
    .array(
      z.object({
        articuloId: z.string().uuid("ID de artículo inválido"),
        cantidad: z.number().int().positive("La cantidad debe ser mayor a 0"),
      }),
    )
    .min(1, "Debe incluir al menos un producto"),
  motivo: z
    .string()
    .min(1, "El motivo es requerido")
    .max(500, "El motivo no puede superar 500 caracteres"),
});

// ─── OUTPUT TYPES ──────────────────────────────────

export type CreatePedidoInput = z.output<typeof createPedidoSchema>;
export type UpdateEstadoInput = z.output<typeof updateEstadoSchema>;
export type CancelarPedidoInput = z.output<typeof cancelarPedidoSchema>;
export type ConfirmarCobroInput = z.output<typeof confirmarCobroSchema>;
export type AsignarDomiciliarioInput = z.output<typeof asignarDomiciliarioSchema>;
export type ModificarPedidoInput = z.output<typeof modificarPedidoSchema>;
