"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth/authorize";
import { db } from "@/lib/db";
import {
  getPedidos,
  getPedidoById,
  createPedido,
  actualizarEstado,
  cancelarPedido,
  confirmarCobroAdmin,
  asignarDomiciliario,
  tomarPedido,
  validateFiadoDebt,
} from "@/lib/services/pedidos";
import { getDeudaCliente } from "@/lib/services/clientes";
import type { PedidoFilters } from "@/lib/services/pedidos";
import {
  createPedidoSchema,
  updateEstadoSchema,
  cancelarPedidoSchema,
  confirmarCobroSchema,
  asignarDomiciliarioSchema,
} from "@/lib/validations/pedidos";
import type {
  CreatePedidoInput,
  UpdateEstadoInput,
  AsignarDomiciliarioInput,
} from "@/lib/validations/pedidos";

// ─── QUERIES ───────────────────────────────────────

export async function getPedidosAction(
  filtros?: PedidoFilters,
): Promise<{ data: Awaited<ReturnType<typeof getPedidos>> } | { error: string }> {
  try {
    const session = await auth();
    if (!session?.user) return { error: "No autenticado" };

    const data = await getPedidos(filtros, {
      id: (session.user as { id: string }).id,
      rol: (session.user as { rol: string }).rol,
    });
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al obtener pedidos" };
  }
}

export async function getPedidoByIdAction(
  id: string,
): Promise<{ data: Awaited<ReturnType<typeof getPedidoById>> } | { error: string }> {
  try {
    const data = await getPedidoById(id);
    if (!data) return { error: "Pedido no encontrado" };
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al obtener el pedido" };
  }
}

// ─── MUTATIONS ──────────────────────────────────────

export async function createPedidoAction(
  raw: Omit<CreatePedidoInput, "creadoPorId">,
): Promise<{ data: Awaited<ReturnType<typeof createPedido>> } | { error: string }> {
  const session = await auth();
  const authError = requireRole("ADMIN", session?.user);
  if (authError) return { error: authError };

  // Parse WITHOUT creadoPorId — it's added after validation
  const parsed = createPedidoSchema.omit({ creadoPorId: true }).safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    if (!session?.user?.id) {
      return { error: "Debes iniciar sesión para crear un pedido" };
    }

    // FIADO debt validation before creating the pedido
    if (parsed.data.metodoPago === "FIADO" && parsed.data.clienteId) {
      // Fetch prices to calculate estimated total for validation
      const articles = await db.articulo.findMany({
        where: { id: { in: parsed.data.items.map((i) => i.articuloId) } },
        select: { id: true, precio: true },
      });
      const priceMap = new Map(articles.map((a) => [a.id, a.precio]));
      const subtotal = parsed.data.items.reduce(
        (s, item) => s + item.cantidad * (priceMap.get(item.articuloId) ?? 0),
        0,
      );
      const estimatedTotal = Math.max(0, subtotal - (parsed.data.descuento ?? 0));
      const validation = await validateFiadoDebt(parsed.data.clienteId, estimatedTotal);
      if (!validation.valido) {
        return { error: "Límite de crédito excedido" };
      }
    }

    const data = await createPedido({
      ...parsed.data,
      creadoPorId: session.user.id,
    } as CreatePedidoInput);
    revalidatePath("/pedidos");
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al crear el pedido" };
  }
}

export async function updateEstadoAction(
  id: string,
  raw: Omit<UpdateEstadoInput, "cambiadoPorId">,
): Promise<{ data: Awaited<ReturnType<typeof actualizarEstado>> } | { error: string }> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const parsed = updateEstadoSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    const user = session.user as { id: string; rol: string };
    const data = await actualizarEstado(
      id,
      {
        ...parsed.data,
        cambiadoPorId: session.user.id,
      } as UpdateEstadoInput,
      { id: user.id, rol: user.rol },
    );
    revalidatePath("/pedidos");
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al actualizar el estado" };
  }
}

export async function tomarPedidoAction(
  id: string,
): Promise<{ data: Awaited<ReturnType<typeof tomarPedido>> } | { error: string }> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const authError = requireRole("DOMICILIARIO", session?.user);
  if (authError) return { error: authError };

  try {
    const data = await tomarPedido(id, (session.user as { id: string }).id);
    revalidatePath("/pedidos");
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al tomar el pedido" };
  }
}

export async function cancelarPedidoAction(
  id: string,
  motivo: string,
): Promise<{ data: Awaited<ReturnType<typeof cancelarPedido>> } | { error: string }> {
  const session = await auth();
  const authError = requireRole("ADMIN", session?.user);
  if (authError) return { error: authError };

  const parsed = cancelarPedidoSchema.safeParse({ motivo, cambiadoPorId: "" });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    const data = await cancelarPedido(id, parsed.data.motivo, session!.user!.id);
    revalidatePath("/pedidos");
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al cancelar el pedido" };
  }
}

export async function confirmarCobroAdminAction(
  id: string,
): Promise<{ data: Awaited<ReturnType<typeof confirmarCobroAdmin>> } | { error: string }> {
  const session = await auth();
  const authError = requireRole(["ADMIN", "SUPERADMIN"], session?.user);
  if (authError) return { error: authError };

  const parsed = confirmarCobroSchema.safeParse({ pedidoId: id });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    const data = await confirmarCobroAdmin(id, session!.user!.id);
    revalidatePath("/pedidos");
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al confirmar el cobro" };
  }
}

// ─── WIZARD HELPERS ──────────────────────────────────────

export async function getClientesAction(
  query: string,
): Promise<
  | { data: { id: string; nombreCompleto: string; telefono: string | null; deuda: number }[] }
  | { error: string }
> {
  try {
    const where: { activo: boolean; nombreCompleto?: { contains: string; mode: "insensitive" } } = {
      activo: true,
    };

    if (query.length >= 2) {
      where.nombreCompleto = { contains: query, mode: "insensitive" };
    }

    const rawClientes = await db.cliente.findMany({
      where,
      select: {
        id: true,
        nombreCompleto: true,
        telefono: true,
      },
      take: 20,
      orderBy: { nombreCompleto: "asc" },
    });

    // Enrich with real-time deuda
    const deudas = await Promise.all(
      rawClientes.map((c) => getDeudaCliente(c.id)),
    );
    const clientes = rawClientes.map((c, i) => ({
      ...c,
      deuda: deudas[i],
    }));
    return { data: clientes };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al buscar clientes",
    };
  }
}

// ─── ASIGNAR DOMICILIARIO ─────────────────────────────

export async function asignarDomiciliarioAction(
  id: string,
  raw: AsignarDomiciliarioInput,
): Promise<
  | { data: Awaited<ReturnType<typeof asignarDomiciliario>> }
  | { error: string }
> {
  const session = await auth();
  const authError = requireRole(["ADMIN", "SUPERADMIN"], session?.user);
  if (authError) return { error: authError };

  const parsed = asignarDomiciliarioSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    const data = await asignarDomiciliario(id, parsed.data.domiciliarioId, session!.user!.id);
    revalidatePath("/pedidos");
    return { data };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al asignar domiciliario",
    };
  }
}

export async function getDomiciliariosAction(): Promise<
  | { data: { id: string; nombre: string }[] }
  | { error: string }
> {
  try {
    const users = await db.user.findMany({
      where: {
        rol: "DOMICILIARIO",
        activo: true,
      },
      select: {
        id: true,
        nombre: true,
      },
      orderBy: { nombre: "asc" },
    });
    return { data: users };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Error al obtener domiciliarios",
    };
  }
}

export async function getArticulosForPedidoAction(
  query: string,
): Promise<
  | { data: { id: string; nombre: string; presentacion: string; precio: number; stockActual: number }[] }
  | { error: string }
> {
  try {
    const where: { activo: boolean; nombre?: { contains: string; mode: "insensitive" } } = {
      activo: true,
    };

    if (query.length >= 2) {
      where.nombre = { contains: query, mode: "insensitive" };
    }

    const articulos = await db.articulo.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        presentacion: true,
        precio: true,
        stockActual: true,
      },
      take: 20,
      orderBy: { nombre: "asc" },
    });
    return { data: articulos };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Error al buscar artículos",
    };
  }
}

export async function getDeudaWarningAction(
  clienteId: string,
): Promise<
  | { data: { deuda: number } }
  | { error: string }
> {
  try {
    const deuda = await getDeudaCliente(clienteId);
    return { data: { deuda } };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Error al obtener deuda del cliente",
    };
  }
}
