"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function authenticate(
  _prevState: { error: string | null } | undefined,
  formData: FormData,
): Promise<{ error: string | null }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Completá todos los campos" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return { error: null };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Credenciales inválidas" };
        case "CallbackRouteError":
          return { error: "Error de autenticación. Intentá de nuevo." };
        default:
          return { error: "Error de autenticación" };
      }
    }
    // Si es NEXT_REDIRECT (redirect interno de Next.js), lo re-lanzamos
    // para que Next.js maneje la navegación correctamente
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest: string }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    // Error inesperado
    console.error("[auth] authenticate error:", error);
    return { error: "Error inesperado. Revisá la consola o intentá de nuevo." };
  }
}
