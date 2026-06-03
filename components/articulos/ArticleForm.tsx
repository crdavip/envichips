"use client";

import { useActionState, useEffect, useState } from "react";
import type { Articulo, Categoria, Presentacion } from "@/lib/generated/prisma/client";
import {
  createArticuloAction,
  deleteArticuloAction,
  updateArticuloAction,
} from "@/app/dashboard/articulos/actions";
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
import { createArticuloSchema, updateArticuloSchema } from "@/lib/validations/articulos";
import type { CreateArticuloInput, UpdateArticuloInput } from "@/lib/validations/articulos";
import { cn } from "@/lib/utils";

// ─── Constants ─────────────────────────────────────

const CATEGORIAS: Categoria[] = [
  "PAPA",
  "PLATANO",
  "MADURO",
  "CHICHARRON",
  "ROSQUITA",
  "ROSCA",
  "DETODITO",
  "ARITOS",
  "OTRO",
];

const PRESENTACIONES: Presentacion[] = [
  "G50",
  "G65",
  "G250",
  "G500",
  "OTRO",
];

// ─── Types ──────────────────────────────────────────

interface ArticleFormProps {
  mode: "create" | "edit";
  initialData?: Articulo;
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

export function ArticleForm({ mode, initialData, onSuccess, onCancel }: ArticleFormProps) {
  // ── Controlled field values (for ganancia auto-computation) ──
  const [nombre, setNombre] = useState(initialData?.nombre ?? "");
  const [categoria, setCategoria] = useState<Categoria | undefined>(initialData?.categoria);
  const [presentacion, setPresentacion] = useState<Presentacion | undefined>(
    initialData?.presentacion,
  );
  const [costo, setCosto] = useState(initialData?.costo ?? 0);
  const [precio, setPrecio] = useState(initialData?.precio ?? 0);
  const [stockMinimo, setStockMinimo] = useState(initialData?.stockMinimo ?? 0);

  const ganancia = precio - costo;

  // ── useActionState ──
  const [formState, formAction, isPending] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const raw = {
        nombre: (formData.get("nombre") as string) ?? "",
        categoria: (formData.get("categoria") as Categoria) ?? "",
        presentacion: (formData.get("presentacion") as Presentacion) ?? "",
        costo: Number(formData.get("costo")) || 0,
        precio: Number(formData.get("precio")) || 0,
        stockMinimo: Number(formData.get("stockMinimo")) || 0,
      };

      // Client-side validation
      const schema = mode === "create" ? createArticuloSchema : updateArticuloSchema;
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
          ? await createArticuloAction(parsed.data as CreateArticuloInput)
          : await updateArticuloAction(initialData!.id, parsed.data as UpdateArticuloInput);

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

  // ── Delete handler (edit mode only) ──
  const handleDelete = async () => {
    if (!initialData) return;
    if (!window.confirm("¿Estás seguro de desactivar este artículo?")) return;

    const result = await deleteArticuloAction(initialData.id);
    if ("error" in result) {
      // Could surface error — for now just silently fail
      return;
    }
    onSuccess?.();
  };

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
      {/* Hidden inputs for controlled values (base-ui Select doesn't populate FormData) */}
      <input type="hidden" name="categoria" value={categoria ?? ""} />
      <input type="hidden" name="presentacion" value={presentacion ?? ""} />
      <input type="hidden" name="costo" value={costo} />
      <input type="hidden" name="precio" value={precio} />

      {/* ── Nombre ── */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="articulo-nombre">Nombre</Label>
        <Input
          id="articulo-nombre"
          name="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className={inputClass("nombre")}
          placeholder="Ej: Papas Limón"
        />
        {fieldError("nombre")}
      </div>

      {/* ── Categoría ── */}
      <div className="flex flex-col gap-1.5">
        <Label>Categoría</Label>
        <SelectRoot
          value={categoria ?? null}
          onValueChange={(value) =>
            setCategoria(value ? (value as Categoria) : undefined)
          }
        >
          <SelectTrigger className={cn("w-full", inputClass("categoria"))}>
            <SelectValue placeholder="Seleccionar...">
              {categoria || "Seleccionar..."}
            </SelectValue>
          </SelectTrigger>
          <SelectPopup>
            <SelectList>
              {CATEGORIAS.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectList>
          </SelectPopup>
        </SelectRoot>
        {fieldError("categoria")}
      </div>

      {/* ── Presentación ── */}
      <div className="flex flex-col gap-1.5">
        <Label>Presentación</Label>
        <SelectRoot
          value={presentacion ?? null}
          onValueChange={(value) =>
            setPresentacion(value ? (value as Presentacion) : undefined)
          }
        >
          <SelectTrigger className={cn("w-full", inputClass("presentacion"))}>
            <SelectValue placeholder="Seleccionar...">
              {presentacion || "Seleccionar..."}
            </SelectValue>
          </SelectTrigger>
          <SelectPopup>
            <SelectList>
              {PRESENTACIONES.map((pres) => (
                <SelectItem key={pres} value={pres}>
                  {pres}
                </SelectItem>
              ))}
            </SelectList>
          </SelectPopup>
        </SelectRoot>
        {fieldError("presentacion")}
      </div>

      {/* ── Costo ── */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="articulo-costo">Costo ($)</Label>
        <Input
          id="articulo-costo"
          type="number"
          min={0}
          value={costo}
          onChange={(e) => setCosto(Math.max(0, Number(e.target.value)))}
          className={inputClass("costo")}
        />
        {fieldError("costo")}
      </div>

      {/* ── Precio ── */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="articulo-precio">Precio ($)</Label>
        <Input
          id="articulo-precio"
          type="number"
          min={0}
          value={precio}
          onChange={(e) => setPrecio(Math.max(0, Number(e.target.value)))}
          className={inputClass("precio")}
        />
        {fieldError("precio")}
      </div>

      {/* ── Ganancia (read-only) ── */}
      <div className="flex flex-col gap-1.5">
        <Label>Ganancia ($)</Label>
        <Input
          type="number"
          value={ganancia}
          readOnly
          className="bg-muted text-emerald-600"
        />
      </div>

      {/* ── Stock Mínimo ── */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="articulo-stockMinimo">Stock Mínimo</Label>
        <Input
          id="articulo-stockMinimo"
          type="number"
          min={0}
          value={stockMinimo}
          onChange={(e) => setStockMinimo(Math.max(0, Number(e.target.value)))}
          className={inputClass("stockMinimo")}
        />
        {fieldError("stockMinimo")}
      </div>

      {/* ── Server error ── */}
      {formState.serverError && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {formState.serverError}
        </p>
      )}

      {/* ── Buttons ── */}
      <div className="flex items-center justify-between gap-2 pt-2">
        <div>
          {mode === "edit" && initialData?.activo && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
            >
              Eliminar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando…" : mode === "create" ? "Crear Artículo" : "Guardar Cambios"}
          </Button>
        </div>
      </div>
    </form>
  );
}
