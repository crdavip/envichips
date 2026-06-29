"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth/authorize";
import type { Cliente } from "@/lib/generated/prisma/client";
import {
  getClientes,
  getClienteById,
  getDeudaCliente,
  getUltimaVisita,
  getHistorialVisitas,
  createCliente,
  updateCliente,
  deleteCliente,
  registerAbono,
  registrarVisita,
} from "@/lib/services/clientes";
import type { ClienteFilters } from "@/lib/services/clientes";
import {
  createClienteSchema,
  updateClienteSchema,
  registerAbonoSchema,
  registrarVisitaSchema,
} from "@/lib/validations/clientes";
import type {
  CreateClienteInput,
  UpdateClienteInput,
  RegisterAbonoInput,
  RegistrarVisitaInput,
} from "@/lib/validations/clientes";

// ─── HELPERS ──────────────────────────────────────

type ClienteConDeuda = Cliente & { deuda: number };

type ClienteConVisita = ClienteConDeuda & {
  ultimaVisita: Date | null;
};

type ClienteDetailConVisita = ClienteConDeuda & {
  abonos: NonNullable<Awaited<ReturnType<typeof getClienteById>>>["abonos"];
  ultimaVisita: Date | null;
  historialVisitas: Awaited<ReturnType<typeof getHistorialVisitas>>;
};

async function fetchDeudas(
  clientes: Cliente[],
): Promise<ClienteConDeuda[]> {
  const deudas = await Promise.all(
    clientes.map((c) => getDeudaCliente(c.id)),
  );
  return clientes.map((c, i) => ({ ...c, deuda: deudas[i] }));
}

async function fetchVisitas(
  clientes: Cliente[],
): Promise<(Date | null)[]> {
  return Promise.all(
    clientes.map((c) => getUltimaVisita(c.id)),
  );
}

// ─── QUERIES ─────────────────────────────────────

export async function getClientesAction(
  filtros?: ClienteFilters,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
): Promise<{ data: ClienteConVisita[] } | { error: string }> {
  try {
    // TODO: server-side sort — reserved for future use
    const clientes = await getClientes({
      ...filtros,
      ...(sortBy ? { sortBy: sortBy as ClienteFilters["sortBy"] } : {}),
      ...(sortOrder ? { sortOrder } : {}),
    });
    const [deudas, visitas] = await Promise.all([
      fetchDeudas(clientes),
      fetchVisitas(clientes),
    ]);
    const data: ClienteConVisita[] = deudas.map((c, i) => ({
      ...c,
      ultimaVisita: visitas[i],
    }));
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
): Promise<{ data: ClienteDetailConVisita } | { error: string }> {
  try {
    const data = await getClienteById(id);
    if (!data) return { error: "Cliente no encontrado" };
    const [deuda, ultimaVisita, historialVisitas] = await Promise.all([
      getDeudaCliente(id),
      getUltimaVisita(id),
      getHistorialVisitas(id, 5),
    ]);
    return { data: { ...data, deuda, ultimaVisita, historialVisitas } };
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
  const session = await auth();
  const authError = requireRole("ADMIN", session?.user);
  if (authError) return { error: authError };

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
  const session = await auth();
  const authError = requireRole("ADMIN", session?.user);
  if (authError) return { error: authError };

  const parsed = registerAbonoSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  try {
    const data = await registerAbono({
      ...parsed.data,
      registradoPorId: session!.user!.id,
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

// ─── VISITAS ────────────────────────────────────────

export async function registrarVisitaAction(
  raw: RegistrarVisitaInput,
): Promise<
  | { data: Awaited<ReturnType<typeof registrarVisita>> }
  | { error: string }
> {
  const session = await auth();
  const authError = requireRole("ADMIN", session?.user);
  if (authError) return { error: authError };

  const parsed = registrarVisitaSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  try {
    const data = await registrarVisita(
      parsed.data.clienteId,
      session!.user!.id,
      parsed.data.notas,
    );
    revalidatePath("/clientes");
    return { data };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Error al registrar la visita",
    };
  }
}
