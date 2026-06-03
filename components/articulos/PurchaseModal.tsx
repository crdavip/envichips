"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus, Search } from "lucide-react";
import type { Articulo, MetodoPago } from "@/lib/generated/prisma/client";
import { registerPurchaseAction } from "@/app/dashboard/articulos/actions";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { formatCOP } from "@/lib/format";

// ─── Types ──────────────────────────────────────────

interface SelectedItem {
  articuloId: string;
  nombre: string;
  cantidad: number;
  costo: number;
  subtotal: number;
}

interface PurchaseModalProps {
  articulos: Articulo[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// ─── Component ──────────────────────────────────────

export function PurchaseModal({
  articulos,
  open,
  onOpenChange,
  onSuccess,
}: PurchaseModalProps) {
  // ── Step ──
  const [step, setStep] = useState<1 | 2>(1);

  // ── Step 1 state ──
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Step 2 state ──
  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0]);
  const [proveedor, setProveedor] = useState("");
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("EFECTIVO");
  const [observaciones, setObservaciones] = useState("");

  // ── Shared state ──
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Debounce search ──
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // ── Derived ──
  const filteredArticulos = articulos.filter(
    (a) =>
      a.activo &&
      (!debouncedQuery ||
        a.nombre.toLowerCase().includes(debouncedQuery.toLowerCase())),
  );

  const hasItems = selectedItems.some((i) => i.cantidad > 0);

  const activeItems = selectedItems.filter((i) => i.cantidad > 0);

  const total = activeItems.reduce((sum, i) => sum + i.subtotal, 0);

  // ── Handlers ──
  const addItem = useCallback(
    (articulo: Articulo) => {
      setSelectedItems((prev) => {
        if (prev.some((i) => i.articuloId === articulo.id)) return prev;
        return [
          ...prev,
          {
            articuloId: articulo.id,
            nombre: articulo.nombre,
            cantidad: 1,
            costo: articulo.costo,
            subtotal: articulo.costo,
          },
        ];
      });
      setError(null);
    },
    [],
  );

  const updateQuantity = useCallback(
    (articuloId: string, cantidad: number) => {
      const q = Math.max(0, cantidad);
      setSelectedItems((prev) =>
        prev.map((item) =>
          item.articuloId === articuloId
            ? { ...item, cantidad: q, subtotal: q * item.costo }
            : item,
        ),
      );
    },
    [],
  );

  const removeItem = useCallback((articuloId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.articuloId !== articuloId));
    setError(null);
  }, []);

  const resetState = useCallback(() => {
    setStep(1);
    setSearchQuery("");
    setDebouncedQuery("");
    setSelectedItems([]);
    setFecha(new Date().toISOString().split("T")[0]);
    setProveedor("");
    setMetodoPago("EFECTIVO");
    setObservaciones("");
    setError(null);
    setSubmitting(false);
  }, []);

  // ── Handle confirm ──
  const handleConfirm = async () => {
    if (!proveedor.trim()) {
      setError("El proveedor es requerido");
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await registerPurchaseAction({
      proveedor: proveedor.trim(),
      metodoPago,
      items: activeItems.map((i) => ({
        articuloId: i.articuloId,
        cantidad: i.cantidad,
        costo: i.costo,
        subtotal: i.subtotal,
      })),
      fecha: new Date(fecha).toISOString(),
      observaciones: observaciones.trim() || undefined,
    });

    if ("error" in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    onSuccess?.();
    onOpenChange(false);
    resetState();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Registrar Compra" : "Confirmar Compra"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Selecciona los artículos y las cantidades"
              : "Revisa los detalles antes de confirmar"}
          </DialogDescription>
        </DialogHeader>
        <DialogClose
          onClick={() => {
            resetState();
            onOpenChange(false);
          }}
        />

        {/* ───── Step 1: Select items ───── */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar artículo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Matching articles */}
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {filteredArticulos.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No se encontraron artículos
                </p>
              )}
              {filteredArticulos.map((a) => {
                const alreadyAdded = selectedItems.some(
                  (i) => i.articuloId === a.id,
                );
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{a.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.categoria} · {formatCOP(a.costo)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => addItem(a)}
                      disabled={alreadyAdded}
                      className="ml-2 shrink-0"
                    >
                      <Plus className="size-3" />
                      Agregar
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Selected items */}
            {selectedItems.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <p className="text-sm font-medium">Artículos seleccionados</p>
                {selectedItems.map((item) => (
                  <div
                    key={item.articuloId}
                    className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCOP(item.subtotal)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        value={item.cantidad}
                        onChange={(e) =>
                          updateQuantity(
                            item.articuloId,
                            Number(e.target.value),
                          )
                        }
                        className="h-7 w-16 text-center text-xs"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removeItem(item.articuloId)}
                      >
                        <Minus className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Actions */}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetState();
                  onOpenChange(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => setStep(2)}
                disabled={!hasItems}
              >
                Siguiente
                <ChevronRight className="size-4" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ───── Step 2: Confirm ───── */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Summary table */}
            <div className="space-y-1">
              <p className="text-sm font-medium">Resumen</p>
              <div className="divide-y rounded-lg border text-sm">
                {activeItems.map((item) => (
                  <div
                    key={item.articuloId}
                    className="flex items-center justify-between px-2 py-1.5"
                  >
                    <span className="text-muted-foreground">
                      {item.nombre} × {item.cantidad}
                    </span>
                    <span className="tabular-nums">
                      {formatCOP(item.subtotal)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-2 py-1.5 font-medium">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCOP(total)}</span>
                </div>
              </div>
            </div>

            {/* Fecha */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="compra-fecha">Fecha</Label>
              <Input
                id="compra-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>

            {/* Proveedor */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="compra-proveedor">Proveedor</Label>
              <Input
                id="compra-proveedor"
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                placeholder="Nombre del proveedor"
              />
            </div>

            {/* Método de pago */}
            <div className="flex flex-col gap-1.5">
              <Label>Método de Pago</Label>
              <SelectRoot
                value={metodoPago}
                onValueChange={(v) => setMetodoPago(v as MetodoPago)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  <SelectList>
                    <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                    <SelectItem value="TRANSFERENCIA">
                      Transferencia
                    </SelectItem>
                  </SelectList>
                </SelectPopup>
              </SelectRoot>
            </div>

            {/* Observaciones */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="compra-observaciones">Observaciones</Label>
              <textarea
                id="compra-observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Opcional"
                rows={3}
                className="flex w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Actions */}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
              >
                <ChevronLeft className="size-4" />
                Volver
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
              >
                {submitting ? "Registrando…" : "Confirmar Compra"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
