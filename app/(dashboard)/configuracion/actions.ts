"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { upsertConfig } from "@/lib/services/configuracion";
import { configSchema } from "@/lib/validations/configuracion";
import type { ConfigInput } from "@/lib/validations/configuracion";

// ─── HELPERS ──────────────────────────────────────

function checkSuperAdmin(rol: string | undefined): string | null {
  if (rol !== "SUPERADMIN") {
    return "No autorizado — solo SuperAdmin";
  }
  return null;
}

// ─── MUTATIONS ────────────────────────────────────

export async function upsertConfigAction(
  raw: ConfigInput,
): Promise<{ data: Awaited<ReturnType<typeof upsertConfig>> } | { error: string }> {
  const session = await auth();
  const authError = checkSuperAdmin(
    (session?.user as { rol?: string })?.rol,
  );
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
