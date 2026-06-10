"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth/authorize";
import type { Cliente } from "@/lib/generated/prisma/client";
import {
  getClientes,
  getClienteById,
  getDeudaCliente,
  createCliente,
  updateCliente,
  deleteCliente,
  registerAbono,
} from "@/lib/services/clientes";
import type { ClienteFilters } from "@/lib/services/clientes";
import {
  createClienteSchema,
  updateClienteSchema,
  registerAbonoSchema,
} from "@/lib/validations/clientes";
import type {
  CreateClienteInput,
  UpdateClienteInput,
  RegisterAbonoInput,
} from "@/lib/validations/clientes";

// ─── HELPERS ──────────────────────────────────────

type ClienteConDeuda = Cliente & { deuda: number };

async function fetchDeudas(
  clientes: Cliente[],
): Promise<ClienteConDeuda[]> {
  const deudas = await Promise.all(
    clientes.map((c) => getDeudaCliente(c.id)),
  );
  return clientes.map((c, i) => ({ ...c, deuda: deudas[i] }));
}

// ─── QUERIES ─────────────────────────────────────

export async function getClientesAction(
  filtros?: ClienteFilters,
): Promise<{ data: ClienteConDeuda[] } | { error: string }> {
  try {
    const clientes = await getClientes(filtros);
    const data = await fetchDeudas(clientes);
    return { data };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Error al obtener clientes",
    };
  }
}

export async function getClienteByIdAction(
  id: string,
): Promise<{ data: ClienteConDeuda } | { error: string }> {
  try {
    const data = await getClienteById(id);
    if (!data) return { error: "Cliente no encontrado" };
    const deuda = await getDeudaCliente(id);
    return { data: { ...data, deuda } };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Error al obtener el cliente",
    };
  }
}

// ─── MUTATIONS ────────────────────────────────────

export async function createClienteAction(
  raw: CreateClienteInput,
): Promise<{ data: Cliente } | { error: string }> {
  const session = await auth();
  const authError = requireRole("ADMIN", session?.user);
  if (authError) return { error: authError };

  const parsed = createClienteSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  try {
    const data = await createCliente(parsed.data);
    revalidatePath("/clientes");
    return { data };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Error al crear el cliente",
    };
  }
}

export async function updateClienteAction(
  id: string,
  raw: UpdateClienteInput,
): Promise<{ data: Cliente } | { error: string }> {
  const session = await auth();
  const authError = requireRole("ADMIN", session?.user);
  if (authError) return { error: authError };

  const parsed = updateClienteSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  try {
    const data = await updateCliente(id, parsed.data);
    revalidatePath("/clientes");
    return { data };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Error al actualizar el cliente",
    };
  }
}

export async function deleteClienteAction(
  id: string,
): Promise<{ data: Cliente } | { error: string }> {
  try {
    const data = await deleteCliente(id);
    revalidatePath("/clientes");
    return { data };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Error al desactivar el cliente",
    };
  }
}

// ─── ABONOS ───────────────────────────────────────

export async function registerAbonoAction(
  raw: RegisterAbonoInput,
): Promise<
  | { data: Awaited<ReturnType<typeof registerAbono>> }
  | { error: string }
> {
  const parsed = registerAbonoSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Debes iniciar sesión para registrar un abono" };
    }

    const data = await registerAbono({
      ...parsed.data,
      registradoPorId: session.user.id,
    });
    revalidatePath("/clientes");
    return { data };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Error al registrar el abono",
    };
  }
}
