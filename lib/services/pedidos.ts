import { db } from "@/lib/db";
import type {
  EstadoPedido,
  EstadoCobro,
  Prisma,
} from "@/lib/generated/prisma/client";
import type {
  CreatePedidoInput,
  UpdateEstadoInput,
  ModificarPedidoInput,
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

  if (user?.rol === "DOMICILIARIO") {
    // DOMICILIARIO sees: available pedidos (PENDIENTE, unassigned) + their own
    where.OR = [
      { estado: "PENDIENTE", domiciliarioId: null },
      { domiciliarioId: user.id },
    ];

    // Apply date filters only if explicitly provided — no "today only" default
    if (filtros?.fechaDesde || filtros?.fechaHasta) {
      where.fecha = {};
      if (filtros.fechaDesde) where.fecha.gte = new Date(filtros.fechaDesde);
      if (filtros.fechaHasta) {
        const end = new Date(filtros.fechaHasta);
        end.setHours(23, 59, 59, 999);
        where.fecha.lte = end;
      }
    }
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
  PENDIENTE: ["EN_CAMINO", "ENTREGADO", "CANCELADO"],
  EN_CAMINO: ["ENTREGADO", "CANCELADO"],
};

const DOMICILIARIO_TRANSITIONS: Record<string, string[]> = {
  PENDIENTE: ["EN_CAMINO"],
  EN_CAMINO: ["ENTREGADO"],
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

    // 4. Always create as PENDIENTE (regardless of domiciliarioId)
    const estado: EstadoPedido = "PENDIENTE";

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

    // 6. Register initial PENDIENTE state (stock decrement happens on ENTREGADO transition)
    await tx.historialEstado.create({
      data: {
        pedidoId: pedido.id,
        estadoAntes: "PENDIENTE",
        estadoDespues: "PENDIENTE",
        cambiadoPorId: data.creadoPorId,
        motivo: "Pedido creado",
      },
    });

    return pedido;
  });
}

// ─── STATE TRANSITIONS ────────────────────────────

export async function actualizarEstado(
  id: string,
  data: UpdateEstadoInput,
  user: { id: string; rol: string },
) {
  return db.$transaction(async (tx) => {
    // 1. Read current pedido with items + domiciliarioId
    const pedido = await tx.pedido.findUniqueOrThrow({
      where: { id },
      include: { items: true },
    });

    // 2. Role-aware permission check
    if (user.rol === "DOMICILIARIO") {
      // DOMICILIARIO can only transition their own assigned pedidos
      if (pedido.domiciliarioId !== user.id) {
        throw new Error("No puedes modificar un pedido que no está asignado a ti");
      }

      // DOMICILIARIO only has limited transitions
      const allowedForRole = DOMICILIARIO_TRANSITIONS[pedido.estado];
      if (!allowedForRole?.includes(data.estado as string)) {
        throw new Error(
          `Transición no permitida para tu rol: ${pedido.estado} → ${data.estado}`,
        );
      }
    } else if (user.rol !== "ADMIN" && user.rol !== "SUPERADMIN") {
      throw new Error("Rol no autorizado para cambiar estados");
    }

    // 3. Validate transition is allowed (general)
    const allowed = ALLOWED_TRANSITIONS[pedido.estado];
    if (!allowed?.includes(data.estado as string)) {
      throw new Error(
        `Transición inválida: ${pedido.estado} → ${data.estado}`,
      );
    }

    // 4. Validate motivo for cancellation
    if (data.estado === "CANCELADO" && !data.motivo) {
      throw new Error("Motivo requerido para cancelar el pedido");
    }

    // 5. Build update payload
    const updateData: Prisma.PedidoUpdateInput = {
      estado: data.estado,
    };

    if (data.dineroCobrado !== undefined) {
      updateData.dineroCobrado = data.dineroCobrado;
    }
    if (data.montoCobrado !== undefined) {
      updateData.montoCobrado = data.montoCobrado;
    }
    // Derive estadoCobro from metodoPago when ENTREGADO
    // (UI sends dineroCobrado boolean, service derives the explicit estadoCobro)
    if (data.estado === "ENTREGADO") {
      if (pedido.metodoPago === "EFECTIVO" && data.dineroCobrado) {
        updateData.estadoCobro = "COBRADO_PARCIAL" as EstadoCobro;
      } else if (pedido.metodoPago === "TRANSFERENCIA") {
        updateData.estadoCobro = "COBRADO_PARCIAL" as EstadoCobro;
      } else {
        updateData.estadoCobro = "PENDIENTE" as EstadoCobro;
      }
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

    // 6. Stock sufficiency check before ENTREGADO
    if (data.estado === "ENTREGADO") {
      for (const item of pedido.items) {
        const articulo = await tx.articulo.findUniqueOrThrow({
          where: { id: item.articuloId },
          select: { stockActual: true, nombre: true },
        });
        if (articulo.stockActual < item.cantidad) {
          throw new Error(
            `Stock insuficiente para ${articulo.nombre}: disponible ${articulo.stockActual}, requerido ${item.cantidad}`,
          );
        }
      }
    }

    // 7. If ENTREGADO: decrement stock for each item
    if (data.estado === "ENTREGADO") {
      for (const item of pedido.items) {
        await tx.articulo.update({
          where: { id: item.articuloId },
          data: { stockActual: { increment: -item.cantidad } },
        });
      }

      // NOTE: deuda calculada en tiempo real via clientes service (no se almacena)
    }

    // 8. Create HistorialEstado
    await tx.historialEstado.create({
      data: {
        pedidoId: id,
        estadoAntes: pedido.estado,
        estadoDespues: data.estado as EstadoPedido,
        cambiadoPorId: user.id,
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

// ─── ASIGNAR DOMICILIARIO ─────────────────────────

export async function asignarDomiciliario(
  id: string,
  domiciliarioId: string | null,
  cambiadoPorId: string,
) {
  return db.$transaction(async (tx) => {
    const pedido = await tx.pedido.findUniqueOrThrow({
      where: { id },
      include: { domiciliario: true },
    });

    // Only allow if pedido is not in a terminal state
    if (pedido.estado === "ENTREGADO" || pedido.estado === "CANCELADO") {
      throw new Error(
        `No se puede cambiar el domiciliario de un pedido ${pedido.estado.toLowerCase()}`,
      );
    }

    const nombreAnterior = pedido.domiciliario?.nombre ?? null;

    // Get new domiciliario name if set
    let nombreNuevo = "Ninguno";
    if (domiciliarioId) {
      const nuevo = await tx.user.findUniqueOrThrow({
        where: { id: domiciliarioId },
        select: { nombre: true },
      });
      nombreNuevo = nuevo.nombre;
    }

    // Build audit motivo
    const motivo = nombreAnterior
      ? `Domiciliario cambiado: ${nombreAnterior} → ${nombreNuevo}`
      : `Domiciliario asignado: ${nombreNuevo}`;

    const updated = await tx.pedido.update({
      where: { id },
      data: { domiciliarioId: domiciliarioId ?? null },
      include: { cliente: true, domiciliario: true, items: true },
    });

    // Register in HistorialEstado (same state, just domiciliario change)
    await tx.historialEstado.create({
      data: {
        pedidoId: id,
        estadoAntes: pedido.estado,
        estadoDespues: pedido.estado,
        cambiadoPorId,
        motivo,
      },
    });

    return updated;
  });
}

// ─── AUTO-ASIGNACIÓN (TOMAR PEDIDO) ────────────────

export async function tomarPedido(id: string, domiciliarioId: string) {
  return db.$transaction(async (tx) => {
    // 1. Validate: user must exist and be active DOMICILIARIO
    const usuario = await tx.user.findUnique({
      where: { id: domiciliarioId },
      select: { id: true, rol: true, activo: true },
    });

    if (!usuario || usuario.rol !== "DOMICILIARIO" || !usuario.activo) {
      throw new Error("Usuario no autorizado para tomar pedidos");
    }

    // 2. Atomic conditional update: only succeeds if pedido is PENDIENTE and unassigned
    //    Transitions to EN_CAMINO directly — tomar = salir a entregar
    const result = await tx.pedido.updateMany({
      where: {
        id,
        domiciliarioId: null,
        estado: "PENDIENTE",
      },
      data: {
        domiciliarioId,
        estado: "EN_CAMINO",
      },
    });

    if (result.count === 0) {
      throw new Error("Pedido no disponible");
    }

    // 3. Register PENDIENTE → EN_CAMINO in historial
    await tx.historialEstado.create({
      data: {
        pedidoId: id,
        estadoAntes: "PENDIENTE",
        estadoDespues: "EN_CAMINO",
        cambiadoPorId: domiciliarioId,
        motivo: "Domiciliario tomó el pedido",
      },
    });

    return tx.pedido.findUnique({
      where: { id },
      include: { cliente: true, domiciliario: true, items: true },
    });
  });
}

// ─── PAYMENT CONFIRMATION ─────────────────────────

export async function confirmarCobroAdmin(id: string, cambiadoPorId: string) {
  return db.$transaction(async (tx) => {
    const pedido = await tx.pedido.findUniqueOrThrow({
      where: { id },
      select: { id: true, pagoEntregadoAdmin: true, estado: true },
    });

    if (pedido.pagoEntregadoAdmin) {
      throw new Error("El cobro de este pedido ya fue confirmado");
    }

    const updated = await tx.pedido.update({
      where: { id },
      data: {
        pagoEntregadoAdmin: true,
        pagoEntregadoEn: new Date(),
        estadoCobro: "COBRADO",
      },
      include: {
        items: true,
        cliente: true,
        domiciliario: true,
      },
    });

    // Register cobro confirmation in historial
    await tx.historialEstado.create({
      data: {
        pedidoId: id,
        estadoAntes: pedido.estado,
        estadoDespues: pedido.estado,
        cambiadoPorId,
        motivo: "Cobro confirmado por administrador",
      },
    });

    return updated;
  });
}

// ─── MODIFY ─────────────────────────────────────────

export async function modificarPedido(
  id: string,
  data: ModificarPedidoInput & { cambiadoPorId: string },
  user: { id: string; rol: string },
) {
  return db.$transaction(async (tx) => {
    // 1. Read current pedido with items + articulo info + domiciliarioId
    const pedido = await tx.pedido.findUniqueOrThrow({
      where: { id },
      include: {
        items: {
          include: { articulo: true },
        },
        cliente: true,
      },
    });

    // 2. Role-aware permission check (same pattern as actualizarEstado)
    if (user.rol === "DOMICILIARIO") {
      if (pedido.domiciliarioId !== user.id) {
        throw new Error("No puedes modificar un pedido que no está asignado a ti");
      }
    } else if (user.rol !== "ADMIN" && user.rol !== "SUPERADMIN") {
      throw new Error("Rol no autorizado para modificar pedidos");
    }

    // 3. State validation: only PENDIENTE or EN_CAMINO
    if (pedido.estado !== "PENDIENTE" && pedido.estado !== "EN_CAMINO") {
      throw new Error(
        `No se puede modificar un pedido en estado ${pedido.estado.toLowerCase()}`,
      );
    }

    // 4. Build item diff
    const currentItems = pedido.items;
    const requestedMap = new Map(data.items.map((i) => [i.articuloId, i.cantidad]));
    const currentMap = new Map(currentItems.map((i) => [i.articuloId, i]));

    // Items to remove: in current but not in request
    const toRemove = currentItems.filter((i) => !requestedMap.has(i.articuloId));

    // Items to update: in both, different qty
    const toUpdate = currentItems.filter((i) => {
      const requestedQty = requestedMap.get(i.articuloId);
      return requestedQty !== undefined && requestedQty !== i.cantidad;
    });

    // Items to create: in request but not in current
    const toCreateEntries = data.items.filter((i) => !currentMap.has(i.articuloId));

    // 5. Fetch article data for new items (name + price + cost in one shot)
    const newArticleData = await Promise.all(
      toCreateEntries.map(async (entry) => {
        const articulo = await tx.articulo.findUniqueOrThrow({
          where: { id: entry.articuloId },
          select: { nombre: true, precio: true, costo: true },
        });
        return {
          ...entry,
          nombre: articulo.nombre,
          precio: articulo.precio,
          costo: articulo.costo,
        };
      }),
    );

    // 6. Build descriptive motivo with change summary
    const changes: string[] = [];
    for (const item of toUpdate) {
      const newQty = requestedMap.get(item.articuloId)!;
      changes.push(`${item.articulo.nombre} x${item.cantidad}→x${newQty} (modificado)`);
    }
    for (const item of toRemove) {
      changes.push(`${item.articulo.nombre} x${item.cantidad}→x0 (eliminado)`);
    }
    for (const nd of newArticleData) {
      changes.push(`${nd.nombre} x${nd.cantidad} (nuevo)`);
    }

    const diffMotivo =
      changes.length > 0
        ? `Items modificados: ${changes.join(", ")}. Motivo: ${data.motivo}`
        : data.motivo;

    // 7. Build final item state for stock check
    const finalItems: { articuloId: string; cantidad: number; nombre: string }[] = [];

    for (const item of currentItems) {
      if (requestedMap.has(item.articuloId)) {
        finalItems.push({
          articuloId: item.articuloId,
          cantidad: requestedMap.get(item.articuloId)!,
          nombre: item.articulo.nombre,
        });
      }
    }
    for (const nd of newArticleData) {
      finalItems.push({
        articuloId: nd.articuloId,
        cantidad: nd.cantidad,
        nombre: nd.nombre,
      });
    }

    // 8. Stock sufficiency check for ALL final items
    for (const { articuloId, cantidad, nombre } of finalItems) {
      const articulo = await tx.articulo.findUniqueOrThrow({
        where: { id: articuloId },
        select: { stockActual: true },
      });
      if (articulo.stockActual < cantidad) {
        throw new Error(
          `Stock insuficiente para ${nombre}: disponible ${articulo.stockActual}, requerido ${cantidad}`,
        );
      }
    }

    // 9. Calculate new totals
    let newSubtotal = 0;

    // Existing items with updated quantities (keep original snapshot prices)
    for (const item of currentItems) {
      const newQty = requestedMap.get(item.articuloId);
      if (newQty !== undefined) {
        newSubtotal += newQty * item.precio;
      }
    }
    // New items (use current prices)
    for (const nd of newArticleData) {
      newSubtotal += nd.cantidad * nd.precio;
    }

    const newTotal = Math.max(0, newSubtotal - pedido.descuento);

    // 10. FIADO re-validation if total changes
    if (pedido.metodoPago === "FIADO" && pedido.clienteId && newTotal !== pedido.total) {
      const validation = await validateFiadoDebt(pedido.clienteId, newTotal);
      if (!validation.valido) {
        throw new Error("Límite de crédito excedido");
      }
    }

    // 11. Execute modifications atomically

    // Delete removed items
    if (toRemove.length > 0) {
      await tx.pedidoItem.deleteMany({
        where: {
          pedidoId: id,
          articuloId: { in: toRemove.map((i) => i.articuloId) },
        },
      });
    }

    // Update existing items with new quantities
    for (const item of toUpdate) {
      const newQty = requestedMap.get(item.articuloId)!;
      await tx.pedidoItem.update({
        where: { id: item.id },
        data: {
          cantidad: newQty,
          subtotal: newQty * item.precio,
          ganancia: newQty * (item.precio - item.costo),
        },
      });
    }

    // Create new items
    if (newArticleData.length > 0) {
      await tx.pedidoItem.createMany({
        data: newArticleData.map((nd) => ({
          articuloId: nd.articuloId,
          cantidad: nd.cantidad,
          precio: nd.precio,
          costo: nd.costo,
          subtotal: nd.cantidad * nd.precio,
          ganancia: nd.cantidad * (nd.precio - nd.costo),
          pedidoId: id,
        })),
      });
    }

    // Update pedido totals
    await tx.pedido.update({
      where: { id },
      data: {
        subtotal: newSubtotal,
        total: newTotal,
      },
    });

    // Create HistorialEstado entry (same-state, descriptive motivo)
    await tx.historialEstado.create({
      data: {
        pedidoId: id,
        estadoAntes: pedido.estado,
        estadoDespues: pedido.estado,
        cambiadoPorId: data.cambiadoPorId,
        motivo: diffMotivo,
      },
    });

    // Return updated pedido with full includes
    return tx.pedido.findUniqueOrThrow({
      where: { id },
      include: {
        items: { include: { articulo: true } },
        historialEstados: {
          include: { cambiadoPor: true },
          orderBy: { creadoEn: "asc" },
        },
        cliente: true,
        domiciliario: true,
      },
    });
  });
}
