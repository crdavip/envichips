"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createMovimiento, softDeleteMovimiento, getMovimientos, getResumenCaja } from "@/lib/services/movimientos";
import type { MovimientoFilters, ResumenCaja } from "@/lib/services/movimientos";
import { createMovimientoSchema, deleteMovimientoSchema, filtrosMovimientosSchema } from "@/lib/validations/movimientos";
import type { FiltrosMovimientosInput } from "@/lib/validations/movimientos";
import { Rol } from "@/lib/generated/prisma/client";

export async function getMovimientosAction(
  filtros?: MovimientoFilters,
): Promise<{ data: { movimientos: Awaited<ReturnType<typeof getMovimientos>>["movimientos"]; total: number; resumen: ResumenCaja } } | { error: string }> {
  try {
    const [movimientosData, resumen] = await Promise.all([
      getMovimientos(filtros),
      getResumenCaja(filtros?.fechaDesde, filtros?.fechaHasta),
    ]);
    return { data: { ...movimientosData, resumen } };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al obtener movimientos" };
  }
}

export async function createMovimientoAction(
  raw: Record<string, unknown>,
): Promise<{ data: Awaited<ReturnType<typeof createMovimiento>> } | { error: string }> {
  const parsed = createMovimientoSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Debes iniciar sesión para crear un movimiento" };
    }

    const data = await createMovimiento({
      ...parsed.data,
      fecha: parsed.data.fecha ? new Date(parsed.data.fecha) : undefined,
      registradoPorId: session.user.id,
    });
    revalidatePath("/dashboard/informes/caja");
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al crear el movimiento" };
  }
}

export async function deleteMovimientoAction(
  raw: Record<string, unknown>,
): Promise<{ data: Awaited<ReturnType<typeof softDeleteMovimiento>> } | { error: string }> {
  const parsed = deleteMovimientoSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return { error: "No autenticado" };
    }

    const { rol } = session.user as { rol: string };
    if (rol !== Rol.SUPERADMIN) {
      return { error: "Solo SuperAdmin puede eliminar movimientos" };
    }

    const data = await softDeleteMovimiento(parsed.data.id, userId, parsed.data.motivo);
    revalidatePath("/dashboard/informes/caja");
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al eliminar el movimiento" };
  }
}
