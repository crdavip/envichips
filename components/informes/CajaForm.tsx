"use client";

import { useActionState, useEffect, useState } from "react";
import { createMovimientoAction } from "@/app/(dashboard)/informes/caja/actions";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { createMovimientoSchema } from "@/lib/validations/movimientos";
import { cn } from "@/lib/utils";

const TIPOS = ["INGRESO", "GASTO", "PRESTAMO"] as const;
const CATEGORIAS = [
  "COMPRA_MERCANCIA",
  "PAGO_DOMICILIARIO",
  "ARRIENDO",
  "SERVICIOS",
  "COBRO_CARTERA",
  "PRESTAMO",
  "OTRO",
] as const;
const METODOS_PAGO = ["EFECTIVO", "TRANSFERENCIA", "FIADO"] as const;

const TIPO_LABEL: Record<string, string> = {
  INGRESO: "Ingreso",
  GASTO: "Gasto",
  PRESTAMO: "Préstamo",
};

const CATEGORIA_LABEL: Record<string, string> = {
  COMPRA_MERCANCIA: "Compra Mercancía",
  PAGO_DOMICILIARIO: "Pago Domiciliario",
  ARRIENDO: "Arriendo",
  SERVICIOS: "Servicios",
  COBRO_CARTERA: "Cobro Cartera",
  PRESTAMO: "Préstamo",
  OTRO: "Otro",
};

const METODO_PAGO_LABEL: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  FIADO: "Fiado",
};

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

export function CajaForm() {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState("INGRESO");
  const [categoria, setCategoria] = useState("OTRO");
  const [monto, setMonto] = useState(0);
  const [descripcion, setDescripcion] = useState("");
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [fecha, setFecha] = useState("");

  useEffect(() => {
    if (open) {
      setTipo("INGRESO");
      setCategoria("OTRO");
      setMonto(0);
      setDescripcion("");
      setMetodoPago("EFECTIVO");
      setFecha("");
    }
  }, [open]);

  const [formState, formAction, isPending] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const raw = {
        tipo: formData.get("tipo") as string,
        categoria: formData.get("categoria") as string,
        monto: Number(formData.get("monto")) || 0,
        descripcion: (formData.get("descripcion") as string) ?? "",
        metodoPago: (formData.get("metodoPago") as string) ?? "EFECTIVO",
        fecha: (formData.get("fecha") as string) || undefined,
      };

      const parsed = createMovimientoSchema.safeParse(raw);
      if (!parsed.success) {
        const errors: FieldErrors = {};
        for (const issue of parsed.error.issues) {
          const path = String(issue.path[0] ?? "");
          if (!errors[path]) errors[path] = [];
          errors[path]!.push(issue.message);
        }
        return { errors, serverError: null, success: false };
      }

      const result = await createMovimientoAction(parsed.data as Record<string, unknown>);
      if ("error" in result) {
        return { errors: {}, serverError: result.error, success: false };
      }

      return { errors: {}, serverError: null, success: true };
    },
    initialState,
  );

  useEffect(() => {
    if (formState.success) {
      setOpen(false);
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
    <>
      <Button onClick={() => setOpen(true)}>Nuevo Movimiento</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Movimiento</DialogTitle>
            <DialogDescription>
              Registra un ingreso, gasto o préstamo de caja
            </DialogDescription>
          </DialogHeader>
          <DialogClose onClick={() => setOpen(false)} />

          <form action={formAction} className="space-y-4">
            <input type="hidden" name="tipo" value={tipo} />
            <input type="hidden" name="categoria" value={categoria} />
            <input type="hidden" name="metodoPago" value={metodoPago} />
            <input type="hidden" name="fecha" value={fecha} />

            <div className="flex flex-col gap-1.5">
              <Label>Tipo</Label>
              <SelectRoot value={tipo} onValueChange={(v) => setTipo(v as string)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{TIPO_LABEL[tipo] ?? tipo}</SelectValue>
                </SelectTrigger>
                <SelectPopup>
                  <SelectList>
                    {TIPOS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {TIPO_LABEL[t] ?? t}
                      </SelectItem>
                    ))}
                  </SelectList>
                </SelectPopup>
              </SelectRoot>
              {fieldError("tipo")}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Categoría</Label>
              <SelectRoot value={categoria} onValueChange={(v) => setCategoria(v as string)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{CATEGORIA_LABEL[categoria] ?? categoria}</SelectValue>
                </SelectTrigger>
                <SelectPopup>
                  <SelectList>
                    {CATEGORIAS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CATEGORIA_LABEL[c] ?? c}
                      </SelectItem>
                    ))}
                  </SelectList>
                </SelectPopup>
              </SelectRoot>
              {fieldError("categoria")}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="caja-monto">Monto ($) *</Label>
              <Input
                id="caja-monto"
                name="monto"
                type="number"
                min={1}
                value={monto || ""}
                onChange={(e) => setMonto(Number(e.target.value))}
                className={inputClass("monto")}
                placeholder="Ej: 50000"
              />
              {fieldError("monto")}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="caja-descripcion">Descripción *</Label>
              <Input
                id="caja-descripcion"
                name="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className={inputClass("descripcion")}
                placeholder="Descripción del movimiento"
              />
              {fieldError("descripcion")}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Método de Pago</Label>
              <SelectRoot value={metodoPago} onValueChange={(v) => setMetodoPago(v as string)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{METODO_PAGO_LABEL[metodoPago] ?? metodoPago}</SelectValue>
                </SelectTrigger>
                <SelectPopup>
                  <SelectList>
                    {METODOS_PAGO.map((m) => (
                      <SelectItem key={m} value={m}>
                        {METODO_PAGO_LABEL[m] ?? m}
                      </SelectItem>
                    ))}
                  </SelectList>
                </SelectPopup>
              </SelectRoot>
              {fieldError("metodoPago")}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="caja-fecha">Fecha</Label>
              <Input
                id="caja-fecha"
                name="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className={inputClass("fecha")}
              />
              {fieldError("fecha")}
            </div>

            {formState.serverError && (
              <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {formState.serverError}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Guardando…" : "Guardar Movimiento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
