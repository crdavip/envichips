"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { upsertConfigAction } from "@/app/(dashboard)/configuracion/actions";
import type { BusinessConfigData } from "@/lib/services/configuracion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────

interface ConfigFormProps {
  initialData: BusinessConfigData;
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

export function ConfigForm({ initialData }: ConfigFormProps) {
  const router = useRouter();

  const [nombreNegocio, setNombreNegocio] = useState(
    initialData.nombreNegocio,
  );
  const [telefonoFactura, setTelefonoFactura] = useState(
    initialData.telefonoFactura ?? "",
  );

  const [formState, formAction, isPending] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const raw = {
        nombreNegocio: (formData.get("nombreNegocio") as string) ?? "",
        telefonoFactura:
          (formData.get("telefonoFactura") as string) || undefined,
      };

      // Call server action directly (Zod validation server-side)
      const result = await upsertConfigAction(raw);

      if ("error" in result) {
        return { errors: {}, serverError: result.error, success: false };
      }

      return { errors: {}, serverError: null, success: true };
    },
    initialState,
  );

  useEffect(() => {
    if (formState.success) {
      router.refresh();
    }
  }, [formState.success, router]);

  const fieldError = (field: string) => {
    const msgs = formState.errors[field];
    if (!msgs || msgs.length === 0) return null;
    return <p className="mt-1 text-xs text-destructive">{msgs[0]}</p>;
  };

  const inputClass = (field: string) =>
    cn(formState.errors[field] && "border-destructive");

  return (
    <form action={formAction} className="space-y-4">
      {/* ── Nombre del Negocio ── */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="config-nombre">Nombre del Negocio *</Label>
        <Input
          id="config-nombre"
          name="nombreNegocio"
          value={nombreNegocio}
          onChange={(e) => setNombreNegocio(e.target.value)}
          className={inputClass("nombreNegocio")}
          placeholder="Ej: Envichips"
        />
        {fieldError("nombreNegocio")}
      </div>

      {/* ── Teléfono para Factura ── */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="config-telefono">Teléfono para Factura</Label>
        <Input
          id="config-telefono"
          name="telefonoFactura"
          value={telefonoFactura}
          onChange={(e) => setTelefonoFactura(e.target.value)}
          className={inputClass("telefonoFactura")}
          placeholder="Ej: 3001234567"
        />
        <p className="text-xs text-muted-foreground">
          Este número aparecerá en las facturas
        </p>
        {fieldError("telefonoFactura")}
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
          Configuración guardada correctamente
        </p>
      )}

      {/* ── Buttons ── */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
