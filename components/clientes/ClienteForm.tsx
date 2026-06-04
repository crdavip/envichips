"use client";

import { useActionState, useEffect, useState } from "react";
import type { Cliente } from "@/lib/generated/prisma/client";
import {
  createClienteAction,
  updateClienteAction,
} from "@/app/dashboard/clientes/actions";
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
  createClienteSchema,
  updateClienteSchema,
} from "@/lib/validations/clientes";
import type {
  CreateClienteInput,
  UpdateClienteInput,
} from "@/lib/validations/clientes";
import { cn } from "@/lib/utils";

// ─── Constants ─────────────────────────────────────

const TIPO_DOCS = ["CC", "TI", "CE", "NIT", "PASAPORTE"] as const;

// ─── Types ──────────────────────────────────────────

interface ClienteFormProps {
  mode: "create" | "edit";
  initialData?: Cliente;
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

export function ClienteForm({
  mode,
  initialData,
  onSuccess,
  onCancel,
}: ClienteFormProps) {
  // ── Controlled field values ──
  const [nombreCompleto, setNombreCompleto] = useState(
    initialData?.nombreCompleto ?? "",
  );
  const [telefono, setTelefono] = useState(initialData?.telefono ?? "");
  const [direccion, setDireccion] = useState(initialData?.direccion ?? "");
  const [tipoDoc, setTipoDoc] = useState<string | undefined>(
    initialData?.tipoDoc ?? undefined,
  );
  const [numeroDoc, setNumeroDoc] = useState(initialData?.numeroDoc ?? "");
  const [limiteCredito, setLimiteCredito] = useState(
    initialData?.limiteCredito ?? 0,
  );

  // ── useActionState ──
  const [formState, formAction, isPending] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const raw = {
        nombreCompleto: (formData.get("nombreCompleto") as string) ?? "",
        telefono: (formData.get("telefono") as string) || undefined,
        direccion: (formData.get("direccion") as string) || undefined,
        tipoDoc: (formData.get("tipoDoc") as string) || undefined,
        numeroDoc: (formData.get("numeroDoc") as string) || undefined,
        limiteCredito: Number(formData.get("limiteCredito")) || 0,
      };

      // Client-side validation
      const schema =
        mode === "create" ? createClienteSchema : updateClienteSchema;
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
          ? await createClienteAction(parsed.data as CreateClienteInput)
          : await updateClienteAction(
              initialData!.id,
              parsed.data as UpdateClienteInput,
            );

      if ("error" in result) {
        return { errors: {}, serverError: result.error, success: false };
      }

      return { errors: {}, serverError: null, success: true };
    },
    initialState,
  );

  // Fire onSuccess when form submission succeeds
  useEffect(() => {
    if (formState.success) {
      onSuccess?.();
    }
  }, [formState.success, onSuccess]);

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
      {/* Hidden inputs for controlled values (Select doesn't populate FormData) */}
      <input type="hidden" name="tipoDoc" value={tipoDoc ?? ""} />

      {/* ── Nombre Completo ── */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cliente-nombreCompleto">Nombre Completo *</Label>
        <Input
          id="cliente-nombreCompleto"
          name="nombreCompleto"
          value={nombreCompleto}
          onChange={(e) => setNombreCompleto(e.target.value)}
          className={inputClass("nombreCompleto")}
          placeholder="Ej: Juan Pérez"
        />
        {fieldError("nombreCompleto")}
      </div>

      {/* ── Teléfono ── */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cliente-telefono">Teléfono</Label>
        <Input
          id="cliente-telefono"
          name="telefono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className={inputClass("telefono")}
          placeholder="Ej: 3001234567"
        />
        {fieldError("telefono")}
      </div>

      {/* ── Dirección ── */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cliente-direccion">Dirección</Label>
        <Input
          id="cliente-direccion"
          name="direccion"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          className={inputClass("direccion")}
          placeholder="Ej: Cra 1 #2-34"
        />
        {fieldError("direccion")}
      </div>

      {/* ── Tipo Documento ── */}
      <div className="flex flex-col gap-1.5">
        <Label>Tipo de Documento</Label>
        <SelectRoot
          value={tipoDoc ?? null}
          onValueChange={(value) =>
            setTipoDoc(value ? (value as string) : undefined)
          }
        >
          <SelectTrigger className={cn("w-full", inputClass("tipoDoc"))}>
            <SelectValue placeholder="Seleccionar...">
              {tipoDoc || "Seleccionar..."}
            </SelectValue>
          </SelectTrigger>
          <SelectPopup>
            <SelectList>
              {TIPO_DOCS.map((doc) => (
                <SelectItem key={doc} value={doc}>
                  {doc}
                </SelectItem>
              ))}
            </SelectList>
          </SelectPopup>
        </SelectRoot>
        {fieldError("tipoDoc")}
      </div>

      {/* ── Número Documento ── */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cliente-numeroDoc">Número de Documento</Label>
        <Input
          id="cliente-numeroDoc"
          name="numeroDoc"
          value={numeroDoc}
          onChange={(e) => setNumeroDoc(e.target.value)}
          className={inputClass("numeroDoc")}
          placeholder="Ej: 1234567890"
        />
        {fieldError("numeroDoc")}
      </div>

      {/* ── Límite de Crédito ── */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cliente-limiteCredito">Límite de Crédito ($)</Label>
        <Input
          id="cliente-limiteCredito"
          name="limiteCredito"
          type="number"
          min={0}
          value={limiteCredito}
          onChange={(e) =>
            setLimiteCredito(Math.max(0, Number(e.target.value)))
          }
          className={inputClass("limiteCredito")}
          placeholder="0"
        />
        <p className="text-xs text-muted-foreground">
          Límite en COP para pedidos FIADO
        </p>
        {fieldError("limiteCredito")}
      </div>

      {/* ── Server error ── */}
      {formState.serverError && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {formState.serverError}
        </p>
      )}

      {/* ── Buttons ── */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Guardando…"
            : mode === "create"
              ? "Crear Cliente"
              : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}
