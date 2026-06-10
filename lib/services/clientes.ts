import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type {
  CreateClienteInput,
  UpdateClienteInput,
  RegisterAbonoInput,
} from "@/lib/validations/clientes";

// ─── FILTERS ──────────────────────────────────────

export interface ClienteFilters {
  nombre?: string;
  telefono?: string;
  estado?: "AL_DIA" | "EN_DEUDA";
  activo?: boolean;
  sortBy?: "nombre" | "idCliente" | "creadoEn";
  sortOrder?: "asc" | "desc";
}

// ─── QUERIES ───────────────────────────────────────

export async function getClientes(filters?: ClienteFilters, userRole?: string) {
  // Domiciliarios should not receive client lists from services.
  if (userRole === "DOMICILIARIO") return [];

  const where: Prisma.ClienteWhereInput = {};

  if (filters?.nombre) {
    where.nombreCompleto = {
      contains: filters.nombre,
      mode: "insensitive",
    };
  }
  if (filters?.telefono) {
    where.telefono = {
      contains: filters.telefono,
      mode: "insensitive",
    };
  }
  if (filters?.estado) {
    where.estado = filters.estado;
  }
  if (filters?.activo !== undefined) {
    where.activo = filters.activo;
  } else {
    where.activo = true; // default: only active
  }

  const SORT_FIELD_MAP: Record<string, keyof Prisma.ClienteOrderByWithRelationInput> = {
    nombre: "nombreCompleto",
    idCliente: "idCliente",
    creadoEn: "creadoEn",
  };

  const orderBy: Prisma.ClienteOrderByWithRelationInput = {};
  if (filters?.sortBy) {
    const prismaField = SORT_FIELD_MAP[filters.sortBy] ?? "nombreCompleto";
    orderBy[prismaField] = filters.sortOrder || "asc";
  } else {
    orderBy.nombreCompleto = "asc";
  }

  return db.cliente.findMany({
    where,
    orderBy,
  });
}

export async function getClienteById(id: string) {
  return db.cliente.findUnique({
    where: { id },
    include: {
      abonos: {
        orderBy: { fecha: "desc" },
      },
    },
  });
}

// ─── SEQUENCE ──────────────────────────────────────

const SEQUENCE_TYPE = "CLIENTE" as const;

/**
 * Generate the next idCliente atomically.
 * Format: CLI-{year}-{4-digit-zero-padded-counter}
 */
async function generarIdCliente(
  tx: Prisma.TransactionClient,
): Promise<string> {
  const year = new Date().getFullYear();

  const sequence = await tx.sequence.upsert({
    where: { year_type: { year, type: SEQUENCE_TYPE } },
    create: { year, type: SEQUENCE_TYPE, counter: 1 },
    update: { counter: { increment: 1 } },
  });

  return `CLI-${year}-${String(sequence.counter).padStart(4, "0")}`;
}

// ─── MUTATIONS ─────────────────────────────────────

export async function createCliente(data: CreateClienteInput) {
  return db.$transaction(async (tx) => {
    const idCliente = await generarIdCliente(tx);

    return tx.cliente.create({
      data: {
        idCliente,
        nombreCompleto: data.nombreCompleto,
        telefono: data.telefono ?? null,
        direccion: data.direccion ?? null,
        tipoDoc: data.tipoDoc ?? null,
        numeroDoc: data.numeroDoc ?? null,
        estado: "AL_DIA",
        limiteCredito: data.limiteCredito ?? null,
      },
    });
  });
}

export async function updateCliente(id: string, data: UpdateClienteInput) {
  return db.cliente.update({
    where: { id },
    data: {
      ...(data.nombreCompleto !== undefined && {
        nombreCompleto: data.nombreCompleto,
      }),
      ...(data.telefono !== undefined && { telefono: data.telefono }),
      ...(data.direccion !== undefined && { direccion: data.direccion }),
      ...(data.tipoDoc !== undefined && { tipoDoc: data.tipoDoc }),
      ...(data.numeroDoc !== undefined && { numeroDoc: data.numeroDoc }),
      ...(data.limiteCredito !== undefined && {
        limiteCredito: data.limiteCredito,
      }),
    },
  });
}

export async function deleteCliente(id: string) {
  return db.cliente.update({
    where: { id },
    data: { activo: false },
  });
}

// ─── DEUDA ─────────────────────────────────────────

/**
 * Calculate debt in real-time:
 * SUM(total of FIADO pedidos where estado ≠ CANCELADO) - SUM(monto of abonos)
 */
export async function getDeudaCliente(clienteId: string): Promise<number> {
  const [pedidosResult, abonosResult] = await Promise.all([
    db.pedido.aggregate({
      where: {
        clienteId,
        metodoPago: "FIADO",
        estado: { not: "CANCELADO" },
      },
      _sum: { total: true },
    }),
    db.abono.aggregate({
      where: { clienteId },
      _sum: { monto: true },
    }),
  ]);

  const totalPedidos = pedidosResult._sum.total ?? 0;
  const totalAbonos = abonosResult._sum.monto ?? 0;
  const deuda = totalPedidos - totalAbonos;

  return deuda < 0 ? 0 : deuda;
}

// ─── ABONOS ────────────────────────────────────────

export async function registerAbono(
  data: RegisterAbonoInput & { registradoPorId: string },
) {
  return db.$transaction(async (tx) => {
    // 1. Create abono record
    const abono = await tx.abono.create({
      data: {
        clienteId: data.clienteId,
        monto: data.monto,
        metodoPago: data.metodoPago,
        notas: data.notas ?? null,
        registradoPorId: data.registradoPorId,
      },
    });

    // 2. Recalculate debt atomically
    const [pedidosResult, abonosResult] = await Promise.all([
      tx.pedido.aggregate({
        where: {
          clienteId: data.clienteId,
          metodoPago: "FIADO",
          estado: { not: "CANCELADO" },
        },
        _sum: { total: true },
      }),
      tx.abono.aggregate({
        where: { clienteId: data.clienteId },
        _sum: { monto: true },
      }),
    ]);

    const totalPedidos = pedidosResult._sum.total ?? 0;
    const totalAbonos = abonosResult._sum.monto ?? 0;
    const deuda = Math.max(0, totalPedidos - totalAbonos);
    const nuevoEstado = deuda > 0 ? "EN_DEUDA" : "AL_DIA";

    // 3. Update cliente estado
    await tx.cliente.update({
      where: { id: data.clienteId },
      data: { estado: nuevoEstado },
    });

    return { abono, deuda, estado: nuevoEstado };
  });
}
