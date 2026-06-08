"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, AlertCircle, LogIn } from "lucide-react";

export function LoginForm({ urlError }: { urlError?: string }) {
  const [error, setError] = useState<string | null>(
    urlError === "CredentialsSignin"
      ? "Credenciales inválidas"
      : urlError
        ? `Error de autenticación (${urlError})`
        : null,
  );
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const csrfRef = useRef<string | null>(null);

  // Fetch CSRF token once on mount
  useEffect(() => {
    fetch("/api/auth/csrf")
      .then((r) => r.json())
      .then((data) => {
        csrfRef.current = data.csrfToken;
      })
      .catch(() => {
        /* will retry on submit */
      });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);

    try {
      // Ensure we have a CSRF token
      let csrfToken = csrfRef.current;
      if (!csrfToken) {
        const csrfRes = await fetch("/api/auth/csrf");
        const data = await csrfRes.json();
        csrfToken = data.csrfToken;
      }

      // Direct native form POST to the credentials callback handler.
      // This bypasses the buggy client signIn() AND the server action signIn()
      // (see nextauthjs/next-auth#13387 for context). The browser handles
      // Set-Cookie and 302 redirects natively — the same flow NextAuth's
      // built-in sign-in page uses and is confirmed working on Vercel.
      // browser handle the 302 redirect naturally. The Set-Cookie headers
      // from the redirect response are stored by the browser.
      // We use a temporary form to submit natively — this is the same
      // pattern NextAuth's built-in sign-in page uses and is confirmed
      // working by nextauthjs/next-auth#13387.
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/api/auth/callback/credentials";

      for (const [key, val] of [
        ["csrfToken", csrfToken!],
        ["email", formData.get("email") as string],
        ["password", formData.get("password") as string],
        ["callbackUrl", "/"],
      ]) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = val;
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
      // The browser navigates away — no need to set isPending(false)
      return;
    } catch (err) {
      console.error("[login] fetch error:", err);
      setError("Error inesperado. Revisá la consola o intentá de nuevo.");
      setIsPending(false);
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardContent className="pt-8">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-foreground">
            Iniciar sesión
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingresá tus credenciales para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="correo@ejemplo.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" disabled={isPending} className="w-full gap-2">
            {isPending ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Iniciando sesión...
              </>
            ) : (
              <>
                <LogIn className="size-4" />
                Iniciar sesión
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
