"use client";

import { useEffect, useState, useTransition, use } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPedidoByIdAction } from "@/app/(dashboard)/pedidos/actions";
import { formatCOP } from "@/lib/format";
import { IsoType } from "@/components/logo/isotype";
import { LogoType } from "@/components/logo/logotype";
import type { PedidoData } from "@/components/pedidos/PedidoDetail";
import "./print.css";

// ─── Props ──────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>;
}

// ─── Helpers ────────────────────────────────────────────

const METODO_PAGO_LABELS: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  FIADO: "Fiado / Crédito",
};

function getMetodoPagoLabel(metodo: string): string {
  return METODO_PAGO_LABELS[metodo] ?? metodo;
}

function formatFecha(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Component ──────────────────────────────────────────

export default function ImprimirPage({ params }: Props) {
  const { id } = use(params);
  const [pedido, setPedido] = useState<PedidoData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Fetch data on mount
  useEffect(() => {
    startTransition(async () => {
      const result = await getPedidoByIdAction(id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setPedido(result.data as unknown as PedidoData);
    });
  }, [id]);

  // Auto-trigger print when data is ready
  useEffect(() => {
    if (pedido) {
      const timer = setTimeout(() => window.print(), 300);
      return () => clearTimeout(timer);
    }
  }, [pedido]);

  // ── Error state ──
  if (error) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="no-print">
          <Link
            href="/pedidos"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
            Volver a pedidos
          </Link>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="font-medium text-destructive">
            Error al cargar el pedido
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // ── Loading state ──
  if (!pedido || isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Invoice content ──
  return (
    <div className="min-h-screen bg-muted/30 p-4 sm:p-6 lg:p-8">
      {/* Screen-only navigation */}
      <div className="no-print mx-auto mb-6 flex max-w-4xl items-center justify-between">
        <Link
          href={`/pedidos/${pedido.id}`}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
          Volver al detalle
        </Link>
        <Button
          onClick={() => window.print()}
          className="gap-2"
          size="sm"
        >
          <Printer className="size-4" />
          Imprimir
        </Button>
      </div>

      {/* Invoice preview */}
      <div className="mx-auto max-w-4xl">
        <div className="print-container">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-6 sm:p-8 lg:p-10">
              {/* ══════ HEADER ══════ */}
              <div className="print-header">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                  <div className="flex items-center gap-3">
                    {/* ── Screen: SVG logo ── */}
                    <IsoType className="print-isotype screen-logo size-14 sm:size-16" />
                    <div className="screen-logo">
                      <LogoType className="print-logotype h-10 w-auto sm:h-12" />
                    </div>
                    {/* ── Print: PNG logo (proporciones correctas) ── */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/logo-print.png"
                      alt="Envichips"
                      className="print-logo-png"
                    />
                  </div>
                </div>
              </div>

              <hr className="print-divider my-6" />

              {/* ══════ INFO ══════ */}
              <div className="print-info grid gap-3 sm:grid-cols-2">
                <div className="print-info-block space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Datos del pedido
                  </p>
                  <div className="print-info-row flex justify-between gap-2">
                    <span className="text-sm font-medium">Pedido:</span>
                    <span className="text-sm font-semibold">{pedido.numeroPedido}</span>
                  </div>
                  <div className="print-info-row flex justify-between gap-2">
                    <span className="text-sm font-medium">Fecha:</span>
                    <span className="text-sm">{formatFecha(pedido.fecha)}</span>
                  </div>
                </div>
                <div className="print-info-block space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Cliente
                  </p>
                  <div className="print-info-row flex justify-between gap-2">
                    <span className="text-sm font-medium">Nombre:</span>
                    <span className="text-sm">
                      {pedido.cliente?.nombreCompleto ?? "N/A"}
                    </span>
                  </div>
                  {pedido.domiciliario && (
                    <div className="print-info-row flex justify-between gap-2">
                      <span className="text-sm font-medium">Domiciliario:</span>
                      <span className="text-sm">{pedido.domiciliario.nombre}</span>
                    </div>
                  )}
                </div>
              </div>

              <hr className="print-divider my-6" />

              {/* ══════ PRODUCTS TABLE ══════ */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Productos
                </p>
                <div className="overflow-hidden rounded-lg border border-border/60">
                  <table className="print-table w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-4">
                          Cant
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-4">
                          Producto
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-4">
                          Unitario
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-4">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {pedido.items.map((item) => (
                        <tr key={item.id} className="transition-colors hover:bg-muted/20">
                          <td className="px-3 py-2.5 text-center text-sm sm:px-4">
                            {item.cantidad}
                          </td>
                          <td className="px-3 py-2.5 text-sm sm:px-4">
                            {item.articulo.nombre}
                          </td>
                          <td className="px-3 py-2.5 text-right text-sm sm:px-4">
                            {formatCOP(item.precio)}
                          </td>
                          <td className="px-3 py-2.5 text-right text-sm font-medium sm:px-4">
                            {formatCOP(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <hr className="print-divider-solid my-6" />

              {/* ══════ TOTALS ══════ */}
              <div className="print-totals ml-auto w-full sm:w-72">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCOP(pedido.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Descuento</span>
                    <span>{formatCOP(pedido.descuento)}</span>
                  </div>
                  <hr className="border-border/60" />
                  <div className="flex justify-between text-base font-bold">
                    <span>TOTAL</span>
                    <span className="text-brand-primary">{formatCOP(pedido.total)}</span>
                  </div>
                </div>
              </div>

              <hr className="print-divider-solid my-6" />

              {/* ══════ PAYMENT + OBSERVATIONS ══════ */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Método de pago:</span>
                    <span className="inline-flex items-center rounded-full border bg-muted/50 px-2.5 py-0.5 text-xs font-medium">
                      {getMetodoPagoLabel(pedido.metodoPago)}
                    </span>
                  </div>
                </div>

                {pedido.observaciones && (
                  <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-sm italic text-muted-foreground">
                    <strong className="not-italic">Observaciones:</strong>{" "}
                    {pedido.observaciones}
                  </div>
                )}
              </div>

              <hr className="print-divider my-6" />

              {/* ══════ FOOTER ══════ */}
              <div className="print-footer text-center">
                <p className="text-sm font-medium text-foreground">
                  ¡Gracias por su compra!
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Envichips — Distribución de Snacks
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
