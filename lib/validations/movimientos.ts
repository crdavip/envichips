import { z } from "zod";

export const TipoMovimientoEnum = z.enum(["INGRESO", "GASTO", "PRESTAMO"]);

export const CategoriaMovimientoEnum = z.enum([
  "COMPRA_MERCANCIA",
  "PAGO_DOMICILIARIO",
  "ARRIENDO",
  "SERVICIOS",
  "COBRO_CARTERA",
  "PRESTAMO",
  "OTRO",
]);

export const MetodoPagoEnum = z.enum(["EFECTIVO", "TRANSFERENCIA", "FIADO"]);

export const createMovimientoSchema = z.object({
  tipo: TipoMovimientoEnum,
  categoria: CategoriaMovimientoEnum,
  monto: z.number().int().positive("Debe ser un valor positivo"),
  descripcion: z.string().min(3, "Descripción debe tener al menos 3 caracteres").max(500),
  metodoPago: MetodoPagoEnum,
  fecha: z.string().optional(),
});

export const deleteMovimientoSchema = z.object({
  id: z.string().uuid(),
  motivo: z.string().min(10, "El motivo debe tener al menos 10 caracteres").max(500),
});

export const filtrosMovimientosSchema = z.object({
  tipo: TipoMovimientoEnum.optional(),
  categoria: CategoriaMovimientoEnum.optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
  incluidosEliminados: z.boolean().optional(),
});

export type CreateMovimientoInput = z.output<typeof createMovimientoSchema>;
export type DeleteMovimientoInput = z.output<typeof deleteMovimientoSchema>;
export type FiltrosMovimientosInput = z.output<typeof filtrosMovimientosSchema>;
