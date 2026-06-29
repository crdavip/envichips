import { db } from "@/lib/db";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { getDeudaCliente, getClientesSinVisita } from "@/lib/services/clientes";
import type { Prisma } from "@/lib/generated/prisma/client";

export interface ResumenDelDia {
  ventasHoy: number;
  gananciaHoy: number;
  pedidosEntregados: number;
  pedidosPorTomar: number;   // PENDIENTE sin domiciliario
  pedidosEnCamino: number;   // EN_CAMINO
  pedidosPendientesCobro: number;  // ENTREGADO con estadoCobro != COBRADO
  totalPorCobrar: number;    // suma de total de ENTREGADO no cobrados
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
  clientesSinVisita: number;
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
  userRole?: string,
): Promise<ResumenDelDia> {
  // If caller is a domiciliario and no domiciliarioId was supplied, return
  // an empty/zeroed resumen to avoid leaking data across users.
  if (userRole === "DOMICILIARIO" && !domiciliarioId) {
    return {
      ventasHoy: 0,
      gananciaHoy: 0,
      pedidosEntregados: 0,
      pedidosPorTomar: 0,
      pedidosEnCamino: 0,
      pedidosPendientesCobro: 0,
      totalPorCobrar: 0,
      stockBajo: { count: 0, productos: [] },
      sinStock: { count: 0, productos: [] },
      clientesEnDeuda: 0,
      clientesSinVisita: 0,
      totalACobrar: 0,
    };
  }
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
    pedidosPorTomar,
    pedidosEnCamino,
    pendientesCobro,
    todosArticulos,
    clientesEnDeuda,
    deudores,
    clientesSinVisita,
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
      where: { estado: "PENDIENTE", domiciliarioId: null },
    }),
    db.pedido.count({
      where: { estado: "EN_CAMINO" },
    }),
    db.pedido.aggregate({
      where: {
        ...pedidoWhere,
        estado: "ENTREGADO",
        estadoCobro: { not: "COBRADO" },
        metodoPago: { not: "FIADO" },
      },
      _sum: { total: true },
      _count: true,
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
    getClientesSinVisita(7).then((r) => r.count),
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
    pedidosPorTomar,
    pedidosEnCamino,
    pedidosPendientesCobro: pendientesCobro._count,
    totalPorCobrar: pendientesCobro._sum.total ?? 0,
    stockBajo: {
      count: stockBajoProductos.length,
      productos: stockBajoProductos,
    },
    sinStock: {
      count: sinStockProductos.length,
      productos: sinStockProductos,
    },
    clientesEnDeuda,
    clientesSinVisita,
    totalACobrar: totalesDeuda.reduce((sum, t) => sum + t, 0),
  };
}

// ─── VENTAS ─────────────────────────────────────────────

export interface VentasPorProducto {
  articuloId: string;
  nombre: string;
  presentacion: string;
  unidadesVendidas: number;
  ingresos: number;
  ganancia: number;
  porcentajeDelTotal: number;
}

export interface ResumenVentas {
  totalVendido: number;
  totalGanancia: number;
  masVendido: { nombre: string; unidades: number } | null;
  masRentable: { nombre: string; ganancia: number } | null;
}

export async function getVentas(
  dateRange: DateRange = "today",
  domiciliarioId?: string,
  userRole?: string,
  customDesde?: Date,
  customHasta?: Date,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
): Promise<{ productos: VentasPorProducto[]; resumen: ResumenVentas }> {
  // TODO: server-side sort — reserved for future use
  const { desde, hasta } = getDateRange(dateRange, customDesde, customHasta);

  const pedidoWhere: Prisma.PedidoWhereInput = {
    fecha: { gte: desde, lte: hasta },
    estado: "ENTREGADO",
  };
  if (domiciliarioId) pedidoWhere.domiciliarioId = domiciliarioId;
  // If caller is a domiciliario and no domiciliarioId provided, deny access
  // by returning empty results.
  if (userRole === "DOMICILIARIO" && !domiciliarioId) {
    return { productos: [], resumen: { totalVendido: 0, totalGanancia: 0, masVendido: null, masRentable: null } };
  }

  const pedidos = await db.pedido.findMany({
    where: pedidoWhere,
    select: { id: true },
  });
  const pedidoIds = pedidos.map((p) => p.id);

  if (pedidoIds.length === 0) {
    return {
      productos: [],
      resumen: { totalVendido: 0, totalGanancia: 0, masVendido: null, masRentable: null },
    };
  }

  const grouped = await db.pedidoItem.groupBy({
    by: ["articuloId"],
    where: { pedidoId: { in: pedidoIds } },
    _sum: { cantidad: true, subtotal: true, ganancia: true },
    orderBy: { _sum: { cantidad: "desc" } },
  });

  const articuloIds = grouped.map((g) => g.articuloId);
  const articulos = await db.articulo.findMany({
    where: { id: { in: articuloIds } },
    select: { id: true, nombre: true, presentacion: true },
  });
  const articuloMap = new Map(articulos.map((a) => [a.id, a]));

  const totalVendido = grouped.reduce((sum, g) => sum + (g._sum.subtotal ?? 0), 0);
  const totalGanancia = grouped.reduce((sum, g) => sum + (g._sum.ganancia ?? 0), 0);

  const productos: VentasPorProducto[] = grouped.map((g) => {
    const art = articuloMap.get(g.articuloId);
    const ingresos = g._sum.subtotal ?? 0;
    return {
      articuloId: g.articuloId,
      nombre: art?.nombre ?? "Desconocido",
      presentacion: art?.presentacion ?? "OTRO",
      unidadesVendidas: g._sum.cantidad ?? 0,
      ingresos,
      ganancia: g._sum.ganancia ?? 0,
      porcentajeDelTotal: totalVendido > 0 ? (ingresos / totalVendido) * 100 : 0,
    };
  });

  const masVendido = [...productos].sort((a, b) => b.unidadesVendidas - a.unidadesVendidas)[0] ?? null;
  const masRentable = [...productos].sort((a, b) => b.ganancia - a.ganancia)[0] ?? null;

  return {
    productos,
    resumen: {
      totalVendido,
      totalGanancia,
      masVendido: masVendido ? { nombre: masVendido.nombre, unidades: masVendido.unidadesVendidas } : null,
      masRentable: masRentable ? { nombre: masRentable.nombre, ganancia: masRentable.ganancia } : null,
    },
  };
}

// ─── GANANCIAS ───────────────────────────────────────────

export interface ResumenGanancias {
  gananciaBruta: number;
  costoVentas: number;
  gastosOperativos: number;
  gananciaNeta: number;
}

export async function getGanancias(
  dateRange: DateRange = "today",
  customDesde?: Date,
  customHasta?: Date,
): Promise<ResumenGanancias> {
  const { desde, hasta } = getDateRange(dateRange, customDesde, customHasta);

  const pedidosEntregados = await db.pedido.findMany({
    where: { estado: "ENTREGADO", fecha: { gte: desde, lte: hasta } },
    select: { id: true },
  });
  const pedidoIds = pedidosEntregados.map((p) => p.id);

  let gananciaBruta = 0;
  let costoVentas = 0;
  if (pedidoIds.length > 0) {
    const itemsAgg = await db.pedidoItem.aggregate({
      where: { pedidoId: { in: pedidoIds } },
      _sum: { ganancia: true, costo: true },
    });
    gananciaBruta = itemsAgg._sum.ganancia ?? 0;
    costoVentas = itemsAgg._sum.costo ?? 0;
  }

  const gastosAgg = await db.movimiento.aggregate({
    where: { tipo: "GASTO", eliminado: false, fecha: { gte: desde, lte: hasta } },
    _sum: { monto: true },
  });
  const gastosOperativos = gastosAgg._sum.monto ?? 0;

  return {
    gananciaBruta,
    costoVentas,
    gastosOperativos,
    gananciaNeta: gananciaBruta - gastosOperativos,
  };
}

// ─── DOMICILIARIO RESUME ─────────────────────────────────

export interface ResumenDomiciliario {
  disponibles: number;
  activos: number;
  entregadosHoy: number;
  totalVendidoHoy: number;
  pendientesCobro: number;       // ENTREGADO sin cobrar del domiciliario
  totalPorCobrarHoy: number;     // suma de ENTREGADO sin cobrar de hoy
}

/**
 * Returns dashboard summary for a DOMICILIARIO user.
 */
export async function getResumenDomiciliario(
  userId: string,
): Promise<ResumenDomiciliario> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [disponibles, activos, entregadosHoy, pendientesCobro] = await Promise.all([
    db.pedido.count({
      where: { estado: "PENDIENTE", domiciliarioId: null },
    }),
    db.pedido.count({
      where: { domiciliarioId: userId, estado: "EN_CAMINO" },
    }),
    db.pedido.aggregate({
      where: {
        domiciliarioId: userId,
        estado: "ENTREGADO",
        fecha: { gte: today, lt: tomorrow },
      },
      _count: true,
      _sum: { total: true },
    }),
    db.pedido.aggregate({
      where: {
        domiciliarioId: userId,
        estado: "ENTREGADO",
        estadoCobro: { not: "COBRADO" },
        metodoPago: { not: "FIADO" },
        fecha: { gte: today, lt: tomorrow },
      },
      _count: true,
      _sum: { total: true },
    }),
  ]);

  return {
    disponibles,
    activos,
    entregadosHoy: entregadosHoy._count,
    totalVendidoHoy: entregadosHoy._sum.total ?? 0,
    pendientesCobro: pendientesCobro._count,
    totalPorCobrarHoy: pendientesCobro._sum.total ?? 0,
  };
}

// ─── DOMICILIARIOS ────────────────────────────────────────

export interface DomiciliarioRow {
  userId: string;
  nombre: string;
  pedidosEntregados: number;
  totalVendido: number;
  efectivoRecolectado: number;
  transferencias: number;
  pedidosCancelados: number;
  totalACobrarAdmin: number;   // ENTREGADO no cobrados (estadoCobro != COBRADO)
}

export async function getDomiciliarios(
  dateRange: DateRange = "today",
  customDesde?: Date,
  customHasta?: Date,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
): Promise<DomiciliarioRow[]> {
  // TODO: server-side sort — reserved for future use
  const { desde, hasta } = getDateRange(dateRange, customDesde, customHasta);

  const domiciliarios = await db.user.findMany({
    where: { rol: "DOMICILIARIO", activo: true },
    select: { id: true, nombre: true },
  });

  const pedidos = await db.pedido.findMany({
    where: {
      domiciliarioId: { not: null },
      fecha: { gte: desde, lte: hasta },
    },
    select: {
      domiciliarioId: true,
      estado: true,
      total: true,
      montoCobrado: true,
      metodoPago: true,
      estadoCobro: true,
    },
  });

  const map = new Map<string, DomiciliarioRow>();
  for (const d of domiciliarios) {
    map.set(d.id, {
      userId: d.id,
      nombre: d.nombre,
      pedidosEntregados: 0,
      totalVendido: 0,
      efectivoRecolectado: 0,
      transferencias: 0,
      pedidosCancelados: 0,
      totalACobrarAdmin: 0,
    });
  }

  for (const p of pedidos) {
    const row = map.get(p.domiciliarioId!);
    if (!row) continue;
    if (p.estado === "ENTREGADO") {
      row.pedidosEntregados++;
      row.totalVendido += p.total;
      if (p.metodoPago === "EFECTIVO" && p.montoCobrado) {
        row.efectivoRecolectado += p.montoCobrado;
      }
      if (p.metodoPago === "TRANSFERENCIA" && p.montoCobrado) {
        row.transferencias += p.montoCobrado;
      }
      if (p.estadoCobro !== "COBRADO" && p.metodoPago !== "FIADO") {
        row.totalACobrarAdmin += p.total;
      }
    }
    if (p.estado === "CANCELADO") {
      row.pedidosCancelados++;
    }
  }

  return Array.from(map.values()).filter(
    (r) => r.pedidosEntregados > 0 || r.pedidosCancelados > 0,
  );
}

// ─── INVENTARIO ─────────────────────────────────────────

export interface InventarioRow {
  id: string;
  nombre: string;
  presentacion: string;
  ingresos: number;
  egresos: number;
  stockActual: number;
  stockMinimo: number;
  estado: "OK" | "BAJO" | "SIN_STOCK";
  valorInventario: number;
}

export interface ResumenInventario {
  totalUnidades: number;
  valorTotal: number;
  agotados: string[];
}

export async function getInventario(
  dateRange: DateRange = "today",
  customDesde?: Date,
  customHasta?: Date,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
): Promise<{ rows: InventarioRow[]; resumen: ResumenInventario }> {
  // TODO: server-side sort — reserved for future use
  const { desde, hasta } = getDateRange(dateRange, customDesde, customHasta);

  const articulos = await db.articulo.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, presentacion: true, stockActual: true, stockMinimo: true, costo: true },
  });

  const compras = await db.compraItem.groupBy({
    by: ["articuloId"],
    where: { compra: { fecha: { gte: desde, lte: hasta } } },
    _sum: { cantidad: true },
  });
  const compraMap = new Map(compras.map((c) => [c.articuloId, c._sum.cantidad ?? 0]));

  const pedidosEntregados = await db.pedido.findMany({
    where: { estado: "ENTREGADO", fecha: { gte: desde, lte: hasta } },
    select: { id: true },
  });
  const pedidoIds = pedidosEntregados.map((p) => p.id);

  let egresoMap = new Map<string, number>();
  if (pedidoIds.length > 0) {
    const egresos = await db.pedidoItem.groupBy({
      by: ["articuloId"],
      where: { pedidoId: { in: pedidoIds } },
      _sum: { cantidad: true },
    });
    egresoMap = new Map(egresos.map((e) => [e.articuloId, e._sum.cantidad ?? 0]));
  }

  const rows: InventarioRow[] = articulos.map((a) => {
    const stockActual = a.stockActual;
    const stockMinimo = a.stockMinimo;
    let estado: "OK" | "BAJO" | "SIN_STOCK";
    if (stockActual === 0) estado = "SIN_STOCK";
    else if (stockActual <= stockMinimo) estado = "BAJO";
    else estado = "OK";

    return {
      id: a.id,
      nombre: a.nombre,
      presentacion: a.presentacion,
      ingresos: compraMap.get(a.id) ?? 0,
      egresos: egresoMap.get(a.id) ?? 0,
      stockActual,
      stockMinimo,
      estado,
      valorInventario: stockActual * a.costo,
    };
  });

  const totalUnidades = rows.reduce((sum, r) => sum + r.stockActual, 0);
  const valorTotal = rows.reduce((sum, r) => sum + r.valorInventario, 0);
  const agotados = rows.filter((r) => r.estado === "SIN_STOCK").map((r) => r.nombre);

  return {
    rows,
    resumen: { totalUnidades, valorTotal, agotados },
  };
}
