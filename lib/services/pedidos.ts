import { db } from "@/lib/db";
import type {
  EstadoPedido,
  Prisma,
} from "@/lib/generated/prisma/client";
import type {
  CreatePedidoInput,
  UpdateEstadoInput,
} from "@/lib/validations/pedidos";
import { getClienteById, getDeudaCliente } from "@/lib/services/clientes";

// ─── FIADO VALIDATION ────────────────────────────

export interface FiadoValidationResult {
  deudaActual: number;
  limiteCredito: number | null;
  valido: boolean;
}

/**
 * Validate FIADO debt limit before creating a pedido.
 * If the client has a limiteCredito, checks (deudaActual + pedidoTotal) <= limiteCredito.
 */
export async function validateFiadoDebt(
  clienteId: string,
  pedidoTotal: number,
): Promise<FiadoValidationResult> {
  const cliente = await getClienteById(clienteId);
  if (!cliente) {
    throw new Error("Cliente no encontrado");
  }

  const deudaActual = await getDeudaCliente(clienteId);

  // If limiteCredito is set and > 0, enforce the limit
  if (cliente.limiteCredito !== null && cliente.limiteCredito > 0) {
    const totalConDeuda = deudaActual + pedidoTotal;
    if (totalConDeuda > cliente.limiteCredito) {
      return { deudaActual, limiteCredito: cliente.limiteCredito, valido: false };
    }
  }

  return { deudaActual, limiteCredito: cliente.limiteCredito ?? null, valido: true };
}

// ─── FILTERS ──────────────────────────────────────

export interface PedidoFilters {
  estado?: EstadoPedido;
  domiciliarioId?: string;
  domiciliarioNombre?: string;
  search?: string;
  fechaDesde?: string; // ISO date
  fechaHasta?: string; // ISO date
}

// ─── QUERIES ──────────────────────────────────────

export async function getPedidos(
  filtros?: PedidoFilters,
  user?: { id: string; rol: string },
) {
  const where: Prisma.PedidoWhereInput = {};

  // Role-aware: domiciliario only sees their TODAY's pedidos
  if (user?.rol === "DOMICILIARIO") {
    where.domiciliarioId = user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    where.fecha = { gte: today, lt: tomorrow };
  } else {
    // Admin/SuperAdmin: apply optional filters
    if (filtros?.estado) where.estado = filtros.estado;
    if (filtros?.domiciliarioId) where.domiciliarioId = filtros.domiciliarioId;
    if (filtros?.domiciliarioNombre) {
      where.domiciliario = {
        nombre: { contains: filtros.domiciliarioNombre, mode: "insensitive" },
      };
    }

    if (filtros?.fechaDesde || filtros?.fechaHasta) {
      where.fecha = {};
      if (filtros.fechaDesde) {
        where.fecha.gte = new Date(filtros.fechaDesde);
      }
      if (filtros.fechaHasta) {
        const end = new Date(filtros.fechaHasta);
        end.setHours(23, 59, 59, 999);
        where.fecha.lte = end;
      }
    }

    if (filtros?.search) {
      where.OR = [
        { numeroPedido: { contains: filtros.search, mode: "insensitive" } },
        {
          cliente: {
            nombreCompleto: { contains: filtros.search, mode: "insensitive" },
          },
        },
      ];
    }
  }

  return db.pedido.findMany({
    where,
    include: {
      cliente: true,
      domiciliario: true,
    },
    orderBy: { fecha: "desc" },
  });
}

export async function getPedidoById(id: string) {
  return db.pedido.findUnique({
    where: { id },
    include: {
      items: {
        include: { articulo: true },
      },
      historialEstados: {
        include: { cambiadoPor: true },
        orderBy: { creadoEn: "asc" },
      },
      cliente: true,
      domiciliario: true,
    },
  });
}

// ─── SEQUENCE ──────────────────────────────────────

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDIENTE: ["EN_CAMINO", "CANCELADO"],
  EN_CAMINO: ["ENTREGADO", "CANCELADO"],
};

const SEQUENCE_TYPE = "PEDIDO" as const;

/**
 * Generate the next numeroPedido atomically.
 * Format: ENV-{year}-{5-digit-zero-padded-counter}
 */
async function generarNumeroPedido(
  tx: Prisma.TransactionClient,
): Promise<string> {
  const year = new Date().getFullYear();

  const sequence = await tx.sequence.upsert({
    where: { year_type: { year, type: SEQUENCE_TYPE } },
    create: { year, type: SEQUENCE_TYPE, counter: 1 },
    update: { counter: { increment: 1 } },
  });

  return `ENV-${year}-${String(sequence.counter).padStart(5, "0")}`;
}

// ─── CREATE ────────────────────────────────────────

export async function createPedido(data: CreatePedidoInput) {
  return db.$transaction(async (tx) => {
    // 1. Generate sequential numeroPedido
    const numeroPedido = await generarNumeroPedido(tx);

    // 2. Snapshot Articulo.precio + Articulo.costo for each item
    const itemsData = await Promise.all(
      data.items.map(async (item) => {
        const articulo = await tx.articulo.findUniqueOrThrow({
          where: { id: item.articuloId },
          select: { precio: true, costo: true },
        });

        return {
          articuloId: item.articuloId,
          cantidad: item.cantidad,
          precio: articulo.precio,
          costo: articulo.costo,
          subtotal: item.cantidad * articulo.precio,
          ganancia: item.cantidad * (articulo.precio - articulo.costo),
        };
      }),
    );

    // 3. Calculate totals
    const subtotal = itemsData.reduce((sum, item) => sum + item.subtotal, 0);
    const descuento = data.descuento ?? 0;
    const total = subtotal - descuento;

    // 4. Determine initial estado
    // Venta directa (sin domiciliario) → ENTREGADO
    const estado: EstadoPedido = data.domiciliarioId ? "PENDIENTE" : "ENTREGADO";

    // 5. Create Pedido with items
    const pedido = await tx.pedido.create({
      data: {
        numeroPedido,
        clienteId: data.clienteId ?? null,
        domiciliarioId: data.domiciliarioId ?? null,
        creadoPorId: data.creadoPorId,
        estado,
        metodoPago: data.metodoPago,
        subtotal,
        descuento,
        total,
        observaciones: data.observaciones ?? null,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
        cliente: true,
        domiciliario: true,
      },
    });

    // 6. If direct sale (ENTREGADO): decrement stock
    if (estado === "ENTREGADO") {
      for (const item of itemsData) {
        await tx.articulo.update({
          where: { id: item.articuloId },
          data: { stockActual: { increment: -item.cantidad } },
        });
      }

      // Register state transition for audit trail
      await tx.historialEstado.create({
        data: {
          pedidoId: pedido.id,
          estadoAntes: "PENDIENTE",
          estadoDespues: "ENTREGADO",
          cambiadoPorId: data.creadoPorId,
          motivo: "Venta directa",
        },
      });
    } else {
      // Register initial PENDIENTE state
      await tx.historialEstado.create({
        data: {
          pedidoId: pedido.id,
          estadoAntes: "PENDIENTE",
          estadoDespues: "PENDIENTE",
          cambiadoPorId: data.creadoPorId,
        },
      });
    }

    return pedido;
  });
}

// ─── STATE TRANSITIONS ────────────────────────────

export async function actualizarEstado(id: string, data: UpdateEstadoInput) {
  return db.$transaction(async (tx) => {
    // 1. Read current pedido with items
    const pedido = await tx.pedido.findUniqueOrThrow({
      where: { id },
      include: { items: true },
    });

    // 2. Validate transition is allowed
    const allowed = ALLOWED_TRANSITIONS[pedido.estado];
    if (!allowed?.includes(data.estado as string)) {
      throw new Error(
        `Transición inválida: ${pedido.estado} → ${data.estado}`,
      );
    }

    // 3. Validate motivo for cancellation
    if (data.estado === "CANCELADO" && !data.motivo) {
      throw new Error("Motivo requerido para cancelar el pedido");
    }

    // 4. Build update payload
    const updateData: Prisma.PedidoUpdateInput = {
      estado: data.estado,
    };

    if (data.dineroCobrado !== undefined) {
      updateData.dineroCobrado = data.dineroCobrado;
    }
    if (data.montoCobrado !== undefined) {
      updateData.montoCobrado = data.montoCobrado;
    }

    const updated = await tx.pedido.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        cliente: true,
        domiciliario: true,
      },
    });

    // 5. If ENTREGADO: decrement stock for each item
    if (data.estado === "ENTREGADO") {
      for (const item of pedido.items) {
        await tx.articulo.update({
          where: { id: item.articuloId },
          data: { stockActual: { increment: -item.cantidad } },
        });
      }

      // NOTE: deuda calculada en tiempo real via clientes service (no se almacena)
    }

    // 6. Create HistorialEstado
    await tx.historialEstado.create({
      data: {
        pedidoId: id,
        estadoAntes: pedido.estado,
        estadoDespues: data.estado as EstadoPedido,
        cambiadoPorId: data.cambiadoPorId,
        motivo: data.motivo ?? null,
      },
    });

    return updated;
  });
}

// ─── CANCEL ────────────────────────────────────────

export async function cancelarPedido(
  id: string,
  motivo: string,
  cambiadoPorId: string,
) {
  const pedido = await db.pedido.findUniqueOrThrow({
    where: { id },
    select: { id: true, estado: true },
  });

  // Reject if ENTREGADO (stock already decremented)
  if (pedido.estado === "ENTREGADO") {
    throw new Error("No se puede cancelar un pedido que ya fue entregado");
  }

  // Reject if already CANCELADO
  if (pedido.estado === "CANCELADO") {
    throw new Error("El pedido ya se encuentra cancelado");
  }

  return db.$transaction(async (tx) => {
    const updated = await tx.pedido.update({
      where: { id },
      data: { estado: "CANCELADO" },
    });

    await tx.historialEstado.create({
      data: {
        pedidoId: id,
        estadoAntes: pedido.estado,
        estadoDespues: "CANCELADO",
        cambiadoPorId,
        motivo,
      },
    });

    return updated;
  });
}

// ─── PAYMENT CONFIRMATION ─────────────────────────

export async function confirmarCobroAdmin(id: string) {
  return db.$transaction(async (tx) => {
    const pedido = await tx.pedido.findUniqueOrThrow({
      where: { id },
      select: { id: true, pagoEntregadoAdmin: true },
    });

    if (pedido.pagoEntregadoAdmin) {
      throw new Error("El cobro de este pedido ya fue confirmado");
    }

    return tx.pedido.update({
      where: { id },
      data: {
        pagoEntregadoAdmin: true,
        pagoEntregadoEn: new Date(),
      },
    });
  });
}
