"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUsuarioAction,
  updateUsuarioAction,
} from "@/app/(dashboard)/usuarios/actions";
import type { UsuarioListado } from "@/lib/services/usuarios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SelectItem,
  SelectList,
  SelectPopup,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createUsuarioSchema,
  updateUsuarioSchema,
  ROLES,
} from "@/lib/validations/usuarios";
import type {
  CreateUsuarioInput,
  UpdateUsuarioInput,
} from "@/lib/validations/usuarios";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────

interface UsuarioFormProps {
  mode: "create" | "edit";
  initialData?: UsuarioListado;
  onSuccess?: () => void;
  onCancel?: () => void;
}

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

export function UsuarioForm({
  mode,
  initialData,
  onSuccess,
  onCancel,
}: UsuarioFormProps) {
  const router = useRouter();

  // ── Controlled field values ──
  const [nombre, setNombre] = useState(initialData?.nombre ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<string | undefined>(
    initialData?.rol ?? undefined,
  );
  const [telefono, setTelefono] = useState(initialData?.telefono ?? "");

  // ── useActionState ──
  const [formState, formAction, isPending] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const raw = {
        nombre: (formData.get("nombre") as string) ?? "",
        email: (formData.get("email") as string) ?? "",
        password: (formData.get("password") as string) ?? "",
        rol: (formData.get("rol") as string) ?? undefined,
        telefono: (formData.get("telefono") as string) || undefined,
      };

      // Client-side validation
      const schema =
        mode === "create" ? createUsuarioSchema : updateUsuarioSchema;
      const parsed = schema.safeParse(raw);

      if (!parsed.success) {
        const errors: FieldErrors = {};
        for (const issue of parsed.error.issues) {
          const path = String(issue.path[0] ?? "");
          if (!errors[path]) errors[path] = [];
          errors[path]!.push(issue.message);
        }
        return { errors, serverError: null, success: false };
      }

      // Call server action
      const result =
        mode === "create"
          ? await createUsuarioAction(parsed.data as CreateUsuarioInput)
          : await updateUsuarioAction(
              initialData!.id,
              parsed.data as UpdateUsuarioInput,
            );

      if ("error" in result) {
        return { errors: {}, serverError: result.error, success: false };
      }

      return { errors: {}, serverError: null, success: true };
    },
    initialState,
  );

  // Fire onSuccess or redirect when form submission succeeds
  useEffect(() => {
    if (formState.success) {
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/usuarios");
        router.refresh();
      }
    }
  }, [formState.success, onSuccess, router]);

  // ── Field error helper ──
  const fieldError = (field: string) => {
    const msgs = formState.errors[field];
    if (!msgs || msgs.length === 0) return null;
    return <p className="mt-1 text-xs text-destructive">{msgs[0]}</p>;
  };

  const inputClass = (field: string) =>
    cn(formState.errors[field] && "border-destructive");

  return (
    <form action={formAction} className="space-y-4">
      {/* Hidden input for controlled values */}
      <input type="hidden" name="rol" value={rol ?? ""} />

      {/* ── Nombre ── */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="usuario-nombre">Nombre *</Label>
        <Input
          id="usuario-nombre"
          name="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className={inputClass("nombre")}
          placeholder="Ej: Juan Pérez"
        />
        {fieldError("nombre")}
      </div>

      {/* ── Email ── */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="usuario-email">Email *</Label>
        <Input
          id="usuario-email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass("email")}
          placeholder="Ej: juan@ejemplo.com"
        />
        {fieldError("email")}
      </div>

      {/* ── Password ── */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="usuario-password">
          {mode === "create" ? "Contraseña *" : "Contraseña (opcional)"}
        </Label>
        <Input
          id="usuario-password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass("password")}
          placeholder={
            mode === "edit" ? "••••••••" : "Mínimo 6 caracteres"
          }
        />
        {mode === "edit" && (
          <p className="text-xs text-muted-foreground">
            Dejá en blanco para mantener la contraseña actual
          </p>
        )}
        {fieldError("password")}
      </div>

      {/* ── Rol ── */}
      <div className="flex flex-col gap-1.5">
        <Label>Rol *</Label>
        <SelectRoot
          value={rol ?? null}
          onValueChange={(value) =>
            setRol(value ? (value as string) : undefined)
          }
        >
          <SelectTrigger className={cn("w-full", inputClass("rol"))}>
            <SelectValue placeholder="Seleccionar...">
              {rol || "Seleccionar..."}
            </SelectValue>
          </SelectTrigger>
          <SelectPopup>
            <SelectList>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectList>
          </SelectPopup>
        </SelectRoot>
        {fieldError("rol")}
      </div>

      {/* ── Teléfono ── */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="usuario-telefono">Teléfono</Label>
        <Input
          id="usuario-telefono"
          name="telefono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className={inputClass("telefono")}
          placeholder="Ej: 3001234567"
        />
        {fieldError("telefono")}
      </div>

      {/* ── Server error ── */}
      {formState.serverError && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {formState.serverError}
        </p>
      )}

      {/* ── Buttons ── */}
      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Guardando…"
            : mode === "create"
              ? "Crear Usuario"
              : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}
