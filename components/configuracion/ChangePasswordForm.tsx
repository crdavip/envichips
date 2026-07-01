"use client";

import { useActionState, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { changePasswordAction } from "@/app/(dashboard)/configuracion/actions";
import { changePasswordSchema } from "@/lib/validations/usuarios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────

type FieldErrors = Partial<Record<string, string[]>>;

interface FormState {
  errors: FieldErrors;
  serverError: string | null;
  success: boolean;
}

const initialState: FormState = {
  errors: {},
  serverError: null,
  success: false,
};

// ─── Component ──────────────────────────────────────

export function ChangePasswordForm() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [formState, formAction, isPending] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const raw = {
        currentPassword: (formData.get("currentPassword") as string) ?? "",
        newPassword: (formData.get("newPassword") as string) ?? "",
        confirmPassword: (formData.get("confirmPassword") as string) ?? "",
      };

      // Client-side validation
      const parsed = changePasswordSchema.safeParse(raw);
      if (!parsed.success) {
        const fieldErrors: FieldErrors = {};
        for (const issue of parsed.error.issues) {
          const path = issue.path[0] as string;
          if (!fieldErrors[path]) fieldErrors[path] = [];
          fieldErrors[path].push(issue.message);
        }
        return { errors: fieldErrors, serverError: null, success: false };
      }

      // Call server action
      const result = await changePasswordAction(parsed.data);

      if ("error" in result) {
        return { errors: {}, serverError: result.error, success: false };
      }

      return { errors: {}, serverError: null, success: true };
    },
    initialState,
  );

  useEffect(() => {
    if (formState.success) {
      const timer = setTimeout(() => {
        signOut({ callbackUrl: "/login" });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [formState.success]);

  const fieldError = (field: string) => {
    const msgs = formState.errors[field];
    if (!msgs || msgs.length === 0) return null;
    return <p className="mt-1 text-xs text-destructive">{msgs[0]}</p>;
  };

  const inputClass = (field: string) =>
    cn(formState.errors[field] && "border-destructive");

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Cambiar Contraseña</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {/* ── Current Password ── */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currentPassword">Contraseña Actual</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                name="currentPassword"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={cn("pr-9", inputClass("currentPassword"))}
                placeholder="Ingresá tu contraseña actual"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                tabIndex={-1}
                aria-label={showCurrent ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {fieldError("currentPassword")}
          </div>

          {/* ── New Password ── */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="newPassword">Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={cn("pr-9", inputClass("newPassword"))}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                tabIndex={-1}
                aria-label={showNew ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {fieldError("newPassword")}
          </div>

          {/* ── Confirm Password ── */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={cn("pr-9", inputClass("confirmPassword"))}
                placeholder="Repetí la nueva contraseña"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                tabIndex={-1}
                aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {fieldError("confirmPassword")}
          </div>

          {/* ── Server error ── */}
          {formState.serverError && (
            <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {formState.serverError}
            </p>
          )}

          {/* ── Success message ── */}
          {formState.success && (
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
              Contraseña cambiada correctamente. Cerrando sesión…
            </p>
          )}

          {/* ── Buttons ── */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Cambiando…" : "Cambiar Contraseña"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
