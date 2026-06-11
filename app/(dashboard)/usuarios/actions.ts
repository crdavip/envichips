"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth/authorize";
import {
  createUsuario,
  updateUsuario,
  toggleUsuarioActivo,
  getUsuarioByEmail,
} from "@/lib/services/usuarios";
import {
  createUsuarioSchema,
  updateUsuarioSchema,
} from "@/lib/validations/usuarios";
import type {
  CreateUsuarioInput,
  UpdateUsuarioInput,
} from "@/lib/validations/usuarios";

// ─── MUTATIONS ────────────────────────────────────

export async function createUsuarioAction(
  raw: CreateUsuarioInput,
): Promise<{ data: Awaited<ReturnType<typeof createUsuario>> } | { error: string }> {
  const session = await auth();
  const authError = requireRole("SUPERADMIN", session?.user);
  if (authError) return { error: authError };

  const parsed = createUsuarioSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  // Check email uniqueness
  const existing = await getUsuarioByEmail(parsed.data.email);
  if (existing) {
    return { error: "Ya existe un usuario con ese email" };
  }

  try {
    const data = await createUsuario(parsed.data, session!.user!.id!);
    revalidatePath("/usuarios");
    return { data };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Error al crear el usuario",
    };
  }
}

export async function updateUsuarioAction(
  id: string,
  raw: UpdateUsuarioInput,
): Promise<{ data: Awaited<ReturnType<typeof updateUsuario>> } | { error: string }> {
  const session = await auth();
  const authError = requireRole("SUPERADMIN", session?.user);
  if (authError) return { error: authError };

  const parsed = updateUsuarioSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  try {
    const data = await updateUsuario(id, parsed.data);
    revalidatePath("/usuarios");
    return { data };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Error al actualizar el usuario",
    };
  }
}

export async function toggleUsuarioAction(
  id: string,
): Promise<{ data: Awaited<ReturnType<typeof toggleUsuarioActivo>> } | { error: string }> {
  const session = await auth();
  const authError = requireRole("SUPERADMIN", session?.user);
  if (authError) return { error: authError };

  try {
    const data = await toggleUsuarioActivo(id, session!.user!.id!);
    revalidatePath("/usuarios");
    return { data };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Error al cambiar estado del usuario",
    };
  }
}
