import { db } from "@/lib/db";
import type { Prisma, TipoMovimiento, CategoriaMovimiento, MetodoPago } from "@/lib/generated/prisma/client";

export interface MovimientoFilters {
  tipo?: TipoMovimiento;
  categoria?: CategoriaMovimiento;
  metodoPago?: MetodoPago;
  fechaDesde?: Date;
  fechaHasta?: Date;
  page?: number;
  limit?: number;
  incluidosEliminados?: boolean;
}

export interface ResumenCaja {
  totalIngresos: number;
  totalGastos: number;
  flujoNeto: number;
  saldoActual: number;
}

export async function getMovimientos(filters?: MovimientoFilters) {
  const where: Prisma.MovimientoWhereInput = {};

  if (!filters?.incluidosEliminados) {
    where.eliminado = false;
  }

  if (filters?.tipo) where.tipo = filters.tipo;
  if (filters?.categoria) where.categoria = filters.categoria;
  if (filters?.metodoPago) where.metodoPago = filters.metodoPago;

  if (filters?.fechaDesde || filters?.fechaHasta) {
    where.fecha = {};
    if (filters.fechaDesde) where.fecha.gte = filters.fechaDesde;
    if (filters.fechaHasta) where.fecha.lte = filters.fechaHasta;
  }

  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 20;
  const skip = (page - 1) * limit;

  const [movimientos, total] = await Promise.all([
    db.movimiento.findMany({
      where,
      orderBy: { fecha: "desc" },
      skip,
      take: limit,
    }),
    db.movimiento.count({ where }),
  ]);

  return { movimientos, total };
}

export async function getMovimientoById(id: string) {
  return db.movimiento.findFirst({
    where: { id, eliminado: false },
  });
}

export async function createMovimiento(data: {
  tipo: TipoMovimiento;
  categoria: CategoriaMovimiento;
  monto: number;
  descripcion: string;
  metodoPago: MetodoPago;
  fecha?: Date;
  registradoPorId: string;
}) {
  return db.movimiento.create({
    data: {
      tipo: data.tipo,
      categoria: data.categoria,
      monto: data.monto,
      descripcion: data.descripcion,
      metodoPago: data.metodoPago,
      fecha: data.fecha ?? new Date(),
      registradoPorId: data.registradoPorId,
    },
  });
}

export async function softDeleteMovimiento(id: string, eliminadoPorId: string, motivo: string) {
  return db.movimiento.update({
    where: { id },
    data: {
      eliminado: true,
      eliminadoEn: new Date(),
      eliminadoPorId,
      motivoEliminacion: motivo,
    },
  });
}

export async function getResumenCaja(fechaDesde?: Date, fechaHasta?: Date): Promise<ResumenCaja> {
  const wherePeriodo: Prisma.MovimientoWhereInput = { eliminado: false };
  if (fechaDesde || fechaHasta) {
    wherePeriodo.fecha = {};
    if (fechaDesde) wherePeriodo.fecha.gte = fechaDesde;
    if (fechaHasta) wherePeriodo.fecha.lte = fechaHasta;
  }

  const [ingresos, gastos, saldoIngresos, saldoGastos] = await Promise.all([
    db.movimiento.aggregate({
      where: { ...wherePeriodo, tipo: "INGRESO" },
      _sum: { monto: true },
    }),
    db.movimiento.aggregate({
      where: { ...wherePeriodo, tipo: "GASTO" },
      _sum: { monto: true },
    }),
    db.movimiento.aggregate({
      where: { eliminado: false, tipo: "INGRESO" },
      _sum: { monto: true },
    }),
    db.movimiento.aggregate({
      where: { eliminado: false, tipo: "GASTO" },
      _sum: { monto: true },
    }),
  ]);

  const totalIngresos = ingresos._sum.monto ?? 0;
  const totalGastos = gastos._sum.monto ?? 0;
  const totalSaldoIngresos = saldoIngresos._sum.monto ?? 0;
  const totalSaldoGastos = saldoGastos._sum.monto ?? 0;

  return {
    totalIngresos,
    totalGastos,
    flujoNeto: totalIngresos - totalGastos,
    saldoActual: totalSaldoIngresos - totalSaldoGastos,
  };
}
