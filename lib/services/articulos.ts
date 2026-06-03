import { db } from "@/lib/db";
import type {
  Categoria,
  Presentacion,
  Prisma,
} from "@/lib/generated/prisma/client";
import type {
  CreateArticuloInput,
  UpdateArticuloInput,
  RegisterPurchaseInput,
} from "@/lib/validations/articulos";

// ─── FILTERS ────────────────────────────────────

export interface ArticuloFilters {
  categoria?: Categoria;
  presentacion?: Presentacion;
  search?: string;
  activo?: boolean;
  sortBy?: "nombre" | "precio" | "stockActual" | "creadoEn";
  sortOrder?: "asc" | "desc";
}

// ─── QUERIES ─────────────────────────────────────

export async function getArticulos(filters?: ArticuloFilters) {
  const where: Prisma.ArticuloWhereInput = {};

  if (filters?.categoria) where.categoria = filters.categoria;
  if (filters?.presentacion) where.presentacion = filters.presentacion;
  if (filters?.activo !== undefined) where.activo = filters.activo;
  if (filters?.search) {
    where.nombre = { contains: filters.search, mode: "insensitive" };
  }

  const orderBy: Prisma.ArticuloOrderByWithRelationInput = {};
  if (filters?.sortBy) {
    orderBy[filters.sortBy] = filters.sortOrder || "asc";
  } else {
    orderBy.nombre = "asc";
  }

  return db.articulo.findMany({
    where,
    orderBy,
  });
}

export async function getArticuloById(id: string) {
  return db.articulo.findUnique({ where: { id } });
}

// ─── MUTATIONS ───────────────────────────────────

export async function createArticulo(data: CreateArticuloInput) {
  return db.articulo.create({
    data: {
      nombre: data.nombre,
      categoria: data.categoria,
      presentacion: data.presentacion,
      costo: data.costo,
      precio: data.precio,
      stockMinimo: data.stockMinimo ?? 0,
    },
  });
}

export async function updateArticulo(id: string, data: UpdateArticuloInput) {
  return db.articulo.update({
    where: { id },
    data: {
      ...(data.nombre !== undefined && { nombre: data.nombre }),
      ...(data.categoria !== undefined && { categoria: data.categoria }),
      ...(data.presentacion !== undefined && {
        presentacion: data.presentacion,
      }),
      ...(data.costo !== undefined && { costo: data.costo }),
      ...(data.precio !== undefined && { precio: data.precio }),
      ...(data.stockMinimo !== undefined && {
        stockMinimo: data.stockMinimo,
      }),
    },
  });
}

export async function deleteArticulo(id: string) {
  return db.articulo.update({
    where: { id },
    data: { activo: false },
  });
}

export async function reactivateArticulo(id: string) {
  return db.articulo.update({
    where: { id },
    data: { activo: true },
  });
}

// ─── PURCHASE ────────────────────────────────────

export async function registerPurchase(data: RegisterPurchaseInput) {
  return db.$transaction(async (tx) => {
    const total = data.items.reduce((sum, item) => sum + item.subtotal, 0);

    const compra = await tx.compra.create({
      data: {
        proveedor: data.proveedor,
        metodoPago: data.metodoPago,
        total,
        observaciones: data.observaciones,
        registradaPorId: "system", // TODO: replace with actual user ID from session
        items: {
          create: data.items.map((item) => ({
            articuloId: item.articuloId,
            cantidad: item.cantidad,
            costo: item.costo,
            subtotal: item.subtotal,
          })),
        },
      },
      include: { items: true },
    });

    // Update stock for each article atomically
    for (const item of data.items) {
      await tx.articulo.update({
        where: { id: item.articuloId },
        data: { stockActual: { increment: item.cantidad } },
      });
    }

    return compra;
  });
}

// ─── HISTORY ─────────────────────────────────────

export async function getHistorialArticulo(articuloId: string) {
  const [compraItems, pedidoItems] = await Promise.all([
    db.compraItem.findMany({
      where: { articuloId },
      include: {
        compra: {
          select: { id: true, fecha: true },
        },
      },
      orderBy: { compra: { fecha: "desc" } },
    }),
    db.pedidoItem.findMany({
      where: {
        articuloId,
        pedido: { estado: "ENTREGADO" },
      },
      include: {
        pedido: {
          select: { id: true, numeroPedido: true, fecha: true },
        },
      },
      orderBy: { pedido: { fecha: "desc" } },
    }),
  ]);

  const movements = [
    ...compraItems.map((item) => ({
      fecha: item.compra.fecha,
      tipo: "entrada" as const,
      cantidad: item.cantidad,
      referencia: `Compra #${item.compra.id.slice(0, 8)}`,
      referenciaId: item.compra.id,
      responsable: "Sistema",
    })),
    ...pedidoItems.map((item) => ({
      fecha: item.pedido.fecha,
      tipo: "salida" as const,
      cantidad: item.cantidad,
      referencia: item.pedido.numeroPedido,
      referenciaId: item.pedido.id,
      responsable: "Sistema",
    })),
  ];

  movements.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

  return movements;
}
