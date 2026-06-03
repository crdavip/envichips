"use server";

import { revalidatePath } from "next/cache";
import type { Articulo } from "@/lib/generated/prisma/client";
import {
  getArticulos,
  getArticuloById,
  createArticulo,
  updateArticulo,
  deleteArticulo,
  reactivateArticulo,
  registerPurchase,
  getHistorialArticulo,
} from "@/lib/services/articulos";
import type { ArticuloFilters } from "@/lib/services/articulos";
import {
  createArticuloSchema,
  updateArticuloSchema,
  registerPurchaseSchema,
} from "@/lib/validations/articulos";
import type {
  CreateArticuloInput,
  UpdateArticuloInput,
  RegisterPurchaseInput,
} from "@/lib/validations/articulos";

// ─── QUERIES ─────────────────────────────────────

export async function getArticulosAction(
  filtros?: ArticuloFilters,
): Promise<{ data: Articulo[] } | { error: string }> {
  try {
    const data = await getArticulos(filtros);
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al obtener artículos" };
  }
}

export async function getArticuloByIdAction(
  id: string,
): Promise<{ data: Articulo } | { error: string }> {
  try {
    const data = await getArticuloById(id);
    if (!data) return { error: "Artículo no encontrado" };
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al obtener el artículo" };
  }
}

// ─── MUTATIONS ────────────────────────────────────

export async function createArticuloAction(
  raw: CreateArticuloInput,
): Promise<{ data: Articulo } | { error: string }> {
  const parsed = createArticuloSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    const data = await createArticulo(parsed.data);
    revalidatePath("/dashboard/articulos");
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al crear el artículo" };
  }
}

export async function updateArticuloAction(
  id: string,
  raw: UpdateArticuloInput,
): Promise<{ data: Articulo } | { error: string }> {
  const parsed = updateArticuloSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    const data = await updateArticulo(id, parsed.data);
    revalidatePath("/dashboard/articulos");
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al actualizar el artículo" };
  }
}

export async function deleteArticuloAction(
  id: string,
): Promise<{ data: Articulo } | { error: string }> {
  try {
    const data = await deleteArticulo(id);
    revalidatePath("/dashboard/articulos");
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al desactivar el artículo" };
  }
}

export async function reactivateArticuloAction(
  id: string,
): Promise<{ data: Articulo } | { error: string }> {
  try {
    const data = await reactivateArticulo(id);
    revalidatePath("/dashboard/articulos");
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al reactivar el artículo" };
  }
}

// ─── PURCHASE ─────────────────────────────────────

export async function registerPurchaseAction(
  raw: RegisterPurchaseInput,
): Promise<{ data: Awaited<ReturnType<typeof registerPurchase>> } | { error: string }> {
  const parsed = registerPurchaseSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    const data = await registerPurchase(parsed.data);
    revalidatePath("/dashboard/articulos");
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al registrar la compra" };
  }
}

// ─── HISTORY ──────────────────────────────────────

export interface MovimientoHistorial {
  fecha: Date;
  tipo: "entrada" | "salida";
  cantidad: number;
  referencia: string;
  referenciaId: string;
  responsable: string;
}

export async function getHistorialArticuloAction(
  id: string,
): Promise<{ data: MovimientoHistorial[] } | { error: string }> {
  try {
    const data = await getHistorialArticulo(id);
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al obtener el historial" };
  }
}
