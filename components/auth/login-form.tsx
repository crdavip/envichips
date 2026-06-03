"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/app/(auth)/login/page";

export function LoginForm({
  loginAction,
}: {
  loginAction: (
    prevState: ActionState,
    formData: FormData,
  ) => Promise<ActionState>;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(loginAction, null);

  useEffect(() => {
    if (state?.success) {
      router.push("/dashboard");
    }
  }, [state, router]);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="correo@ejemplo.com"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-500 font-medium">{state.error}</p>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Iniciando sesión..." : "Iniciar sesión"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
