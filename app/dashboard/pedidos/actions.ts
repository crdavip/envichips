"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getPedidos,
  getPedidoById,
  createPedido,
  actualizarEstado,
  cancelarPedido,
  confirmarCobroAdmin,
} from "@/lib/services/pedidos";
import type { PedidoFilters } from "@/lib/services/pedidos";
import {
  createPedidoSchema,
  updateEstadoSchema,
  cancelarPedidoSchema,
  confirmarCobroSchema,
} from "@/lib/validations/pedidos";
import type {
  CreatePedidoInput,
  UpdateEstadoInput,
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
  const parsed = createPedidoSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Debes iniciar sesión para crear un pedido" };
    }

    const data = await createPedido({
      ...parsed.data,
      creadoPorId: session.user.id,
    } as CreatePedidoInput);
    revalidatePath("/dashboard/pedidos");
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al crear el pedido" };
  }
}

export async function updateEstadoAction(
  id: string,
  raw: Omit<UpdateEstadoInput, "cambiadoPorId">,
): Promise<{ data: Awaited<ReturnType<typeof actualizarEstado>> } | { error: string }> {
  const parsed = updateEstadoSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Debes iniciar sesión para actualizar el estado" };
    }

    const data = await actualizarEstado(id, {
      ...parsed.data,
      cambiadoPorId: session.user.id,
    } as UpdateEstadoInput);
    revalidatePath("/dashboard/pedidos");
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al actualizar el estado" };
  }
}

export async function cancelarPedidoAction(
  id: string,
  motivo: string,
): Promise<{ data: Awaited<ReturnType<typeof cancelarPedido>> } | { error: string }> {
  const parsed = cancelarPedidoSchema.safeParse({ motivo, cambiadoPorId: "" });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Debes iniciar sesión para cancelar el pedido" };
    }

    const data = await cancelarPedido(id, parsed.data.motivo, session.user.id);
    revalidatePath("/dashboard/pedidos");
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al cancelar el pedido" };
  }
}

export async function confirmarCobroAdminAction(
  id: string,
): Promise<{ data: Awaited<ReturnType<typeof confirmarCobroAdmin>> } | { error: string }> {
  const parsed = confirmarCobroSchema.safeParse({ pedidoId: id });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "No autenticado" };
    }

    const { rol } = session.user as { rol: string };
    if (rol !== "ADMIN" && rol !== "SUPERADMIN") {
      return { error: "Solo administradores pueden confirmar cobros" };
    }

    const data = await confirmarCobroAdmin(id);
    revalidatePath("/dashboard/pedidos");
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
    if (query.length < 2) {
      return { data: [] as { id: string; nombreCompleto: string; telefono: string | null; deuda: number }[] };
    }

    const clientes = await db.cliente.findMany({
      where: {
        activo: true,
        nombreCompleto: { contains: query, mode: "insensitive" },
      },
      select: {
        id: true,
        nombreCompleto: true,
        telefono: true,
        deuda: true,
      },
      take: 10,
      orderBy: { nombreCompleto: "asc" },
    });
    return { data: clientes };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al buscar clientes",
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
    if (query.length < 2) {
      return { data: [] as { id: string; nombre: string; presentacion: string; precio: number; stockActual: number }[] };
    }

    const articulos = await db.articulo.findMany({
      where: {
        activo: true,
        nombre: { contains: query, mode: "insensitive" },
      },
      select: {
        id: true,
        nombre: true,
        presentacion: true,
        precio: true,
        stockActual: true,
      },
      take: 15,
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
