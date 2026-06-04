import { db } from "@/lib/db";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { getDeudaCliente } from "@/lib/services/clientes";
import type { Prisma } from "@/lib/generated/prisma/client";

export interface ResumenDelDia {
  ventasHoy: number;
  gananciaHoy: number;
  pedidosEntregados: number;
  pedidosPendientes: number;
  stockBajo: {
    count: number;
    productos: {
      id: string;
      nombre: string;
      stockActual: number;
      stockMinimo: number;
    }[];
  };
  sinStock: {
    count: number;
    productos: { id: string; nombre: string }[];
  };
  clientesEnDeuda: number;
  totalACobrar: number;
}

export type DateRange = "today" | "week" | "month" | "custom";

export function getDateRange(
  range: DateRange,
  customDesde?: Date,
  customHasta?: Date,
) {
  const now = new Date();
  switch (range) {
    case "today":
      return { desde: startOfDay(now), hasta: endOfDay(now) };
    case "week":
      return {
        desde: startOfWeek(now, { weekStartsOn: 1 }),
        hasta: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case "month":
      return { desde: startOfMonth(now), hasta: endOfMonth(now) };
    case "custom":
      return {
        desde: customDesde ?? startOfDay(now),
        hasta: customHasta ?? endOfDay(now),
      };
  }
}

export async function getResumenDelDia(
  dateRange: DateRange = "today",
  domiciliarioId?: string,
  customDesde?: Date,
  customHasta?: Date,
): Promise<ResumenDelDia> {
  const { desde, hasta } = getDateRange(dateRange, customDesde, customHasta);

  const pedidoWhere: Prisma.PedidoWhereInput = {
    fecha: { gte: desde, lte: hasta },
  };
  if (domiciliarioId) pedidoWhere.domiciliarioId = domiciliarioId;

  const pedidoItemWhere: Prisma.PedidoItemWhereInput = {
    pedido: {
      estado: "ENTREGADO",
      fecha: { gte: desde, lte: hasta },
      ...(domiciliarioId ? { domiciliarioId } : {}),
    },
  };

  const [
    ventasAgg,
    gananciaItems,
    pedidosEntregados,
    pedidosPendientes,
    todosArticulos,
    clientesEnDeuda,
    deudores,
  ] = await Promise.all([
    db.pedido.aggregate({
      where: { ...pedidoWhere, estado: "ENTREGADO" },
      _sum: { total: true },
    }),
    db.pedidoItem.findMany({
      where: pedidoItemWhere,
      select: { ganancia: true },
    }),
    db.pedido.count({
      where: { ...pedidoWhere, estado: "ENTREGADO" },
    }),
    db.pedido.count({
      where: { estado: { in: ["PENDIENTE", "EN_CAMINO"] } },
    }),
    db.articulo.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, stockActual: true, stockMinimo: true },
    }),
    db.cliente.count({
      where: { estado: "EN_DEUDA" },
    }),
    db.cliente.findMany({
      where: { estado: "EN_DEUDA" },
      select: { id: true },
    }),
  ]);

  const stockBajoProductos = todosArticulos.filter(
    (a) => a.stockActual > 0 && a.stockActual <= a.stockMinimo,
  );
  const sinStockProductos = todosArticulos.filter((a) => a.stockActual === 0);

  const totalesDeuda = await Promise.all(
    deudores.map((c) => getDeudaCliente(c.id)),
  );

  return {
    ventasHoy: ventasAgg._sum.total ?? 0,
    gananciaHoy: gananciaItems.reduce((sum, item) => sum + item.ganancia, 0),
    pedidosEntregados,
    pedidosPendientes,
    stockBajo: {
      count: stockBajoProductos.length,
      productos: stockBajoProductos,
    },
    sinStock: {
      count: sinStockProductos.length,
      productos: sinStockProductos,
    },
    clientesEnDeuda,
    totalACobrar: totalesDeuda.reduce((sum, t) => sum + t, 0),
  };
}
