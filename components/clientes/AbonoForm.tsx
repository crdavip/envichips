"use client";

import { useActionState, useEffect, useState } from "react";
import { registerAbonoAction } from "@/app/(dashboard)/clientes/actions";
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
import { registerAbonoSchema } from "@/lib/validations/clientes";
import { cn } from "@/lib/utils";

// ─── Constants ─────────────────────────────────────

const METODOS_PAGO = ["EFECTIVO", "TRANSFERENCIA", "FIADO"] as const;

const METODO_PAGO_LABEL: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  FIADO: "Fiado",
};

// ─── Types ──────────────────────────────────────────

interface AbonoFormProps {
  clienteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
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

export function AbonoForm({
  clienteId,
  open,
  onOpenChange,
  onSuccess,
}: AbonoFormProps) {
  // ── Controlled field values ──
  const [monto, setMonto] = useState<number>(0);
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [notas, setNotas] = useState("");

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setMonto(0);
      setMetodoPago("EFECTIVO");
      setNotas("");
    }
  }, [open]);

  // ── useActionState ──
  const [formState, formAction, isPending] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      const raw = {
        clienteId,
        monto: Number(formData.get("monto")) || 0,
        metodoPago: (formData.get("metodoPago") as string) ?? "EFECTIVO",
        notas: (formData.get("notas") as string) || undefined,
      };

      // Client-side validation
      const parsed = registerAbonoSchema.safeParse(raw);
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
      const result = await registerAbonoAction(parsed.data);
      if ("error" in result) {
        return { errors: {}, serverError: result.error, success: false };
      }

      return { errors: {}, serverError: null, success: true };
    },
    initialState,
  );

  // Fire success callback and close
  useEffect(() => {
    if (formState.success) {
      onSuccess?.();
      onOpenChange(false);
    }
  }, [formState.success, onSuccess, onOpenChange]);

  // ── Field error helper ──
  const fieldError = (field: string) => {
    const msgs = formState.errors[field];
    if (!msgs || msgs.length === 0) return null;
    return <p className="mt-1 text-xs text-destructive">{msgs[0]}</p>;
  };

  const inputClass = (field: string) =>
    cn(formState.errors[field] && "border-destructive");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Abono</DialogTitle>
          <DialogDescription>
            Registra un abono para reducir la deuda del cliente
          </DialogDescription>
        </DialogHeader>
        <DialogClose onClick={() => onOpenChange(false)} />

        <form action={formAction} className="space-y-4">
          {/* Hidden input for controlled Select value */}
          <input type="hidden" name="metodoPago" value={metodoPago} />

          {/* ── Monto ── */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="abono-monto">Monto ($) *</Label>
            <Input
              id="abono-monto"
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

          {/* ── Método de Pago ── */}
          <div className="flex flex-col gap-1.5">
            <Label>Método de Pago</Label>
            <SelectRoot
              value={metodoPago}
              onValueChange={(v) => setMetodoPago(v as string)}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {METODO_PAGO_LABEL[metodoPago] ?? metodoPago}
                </SelectValue>
              </SelectTrigger>
              <SelectPopup>
                <SelectList>
                  {METODOS_PAGO.map((metodo) => (
                    <SelectItem key={metodo} value={metodo}>
                      {METODO_PAGO_LABEL[metodo] ?? metodo}
                    </SelectItem>
                  ))}
                </SelectList>
              </SelectPopup>
            </SelectRoot>
            {fieldError("metodoPago")}
          </div>

          {/* ── Notas ── */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="abono-notas">Notas</Label>
            <textarea
              id="abono-notas"
              name="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Opcional"
              rows={3}
              className="flex w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {fieldError("notas")}
          </div>

          {/* ── Server error ── */}
          {formState.serverError && (
            <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {formState.serverError}
            </p>
          )}

          {/* ── Footer Buttons ── */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Registrando…" : "Registrar Abono"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
