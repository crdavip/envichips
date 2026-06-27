"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { registrarVisitaAction } from "@/app/(dashboard)/clientes/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

// ─── Types ──────────────────────────────────────────

interface RegistrarVisitaFormProps {
  clienteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface FormState {
  error: string | null;
  success: boolean;
}

const initialState: FormState = {
  error: null,
  success: false,
};

// ─── Component ──────────────────────────────────────

export function RegistrarVisitaForm({
  clienteId,
  open,
  onOpenChange,
  onSuccess,
}: RegistrarVisitaFormProps) {
  const router = useRouter();

  // ── Controlled field state ──
  const [notas, setNotas] = useState("");

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setNotas("");
    }
  }, [open]);

  // ── useActionState ──
  const [formState, formAction, isPending] = useActionState(
    async (_prev: FormState, formData: FormData): Promise<FormState> => {
      try {
        const result = await registrarVisitaAction({
          clienteId,
          notas: (formData.get("notas") as string) || undefined,
        });

        if ("error" in result) {
          return { error: result.error, success: false };
        }

        return { error: null, success: true };
      } catch {
        return { error: "Error al registrar la visita", success: false };
      }
    },
    initialState,
  );

  // Fire success callback and close
  useEffect(() => {
    if (formState.success) {
      onSuccess?.();
      router.refresh();
      onOpenChange(false);
    }
  }, [formState.success, onSuccess, onOpenChange, router]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Visita</DialogTitle>
          <DialogDescription>
            Registrá una visita de cobro o seguimiento a este cliente
          </DialogDescription>
        </DialogHeader>
        <DialogClose onClick={() => onOpenChange(false)} />

        <form action={formAction} className="space-y-4">
          {/* ── Notas ── */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="visita-notas">Notas</Label>
            <textarea
              id="visita-notas"
              name="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Opcional — resultado de la visita, acuerdos, etc."
              rows={4}
              className="flex w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* ── Server error ── */}
          {formState.error && (
            <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {formState.error}
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
              {isPending ? "Registrando…" : "Registrar Visita"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
