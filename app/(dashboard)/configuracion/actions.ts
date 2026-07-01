"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { requireRole, requireAuth } from "@/lib/auth/authorize";
import { upsertConfig } from "@/lib/services/configuracion";
import { changePassword } from "@/lib/services/usuarios";
import { configSchema } from "@/lib/validations/configuracion";
import { changePasswordSchema } from "@/lib/validations/usuarios";
import type { ConfigInput } from "@/lib/validations/configuracion";
import type { ChangePasswordInput } from "@/lib/validations/usuarios";

// ─── MUTATIONS ────────────────────────────────────

export async function changePasswordAction(
  raw: ChangePasswordInput,
): Promise<{ success: true } | { error: string }> {
  const session = await auth();
  const authError = requireAuth(session?.user);
  if (authError) return { error: authError };

  const parsed = changePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  try {
    await changePassword(
      session!.user!.id!,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    );
    revalidatePath("/configuracion");
    return { success: true };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Error al cambiar la contraseña",
    };
  }
}

export async function upsertConfigAction(
  raw: ConfigInput,
): Promise<{ data: Awaited<ReturnType<typeof upsertConfig>> } | { error: string }> {
  const session = await auth();
  const authError = requireRole("SUPERADMIN", session?.user);
  if (authError) return { error: authError };

  const parsed = configSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  try {
    const data = await upsertConfig(parsed.data, session!.user!.id!);
    revalidatePath("/configuracion");
    return { data };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Error al guardar la configuración",
    };
  }
}
