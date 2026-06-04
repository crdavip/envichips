"use client";

import { useEffect, useState, useTransition, use } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPedidoByIdAction } from "@/app/dashboard/pedidos/actions";
import { formatCOP } from "@/lib/format";
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
      // Server actions serialize Date to string over the wire,
      // but TS still sees Prisma Date types — cast through unknown.
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
            href="/dashboard/pedidos"
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

  // ── Invoice (pedido is non-null after guards above) ──
  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Screen-only navigation */}
      <div className="no-print flex items-center justify-between">
        <Link
          href={`/dashboard/pedidos/${pedido.id}`}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
          Volver al detalle
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="gap-1.5"
        >
          <Printer className="size-4" />
          Imprimir
        </Button>
      </div>

      {/* Invoice content */}
      <div className="print-container">
        {/* ── Header ── */}
        <div className="print-header">
          <p className="print-brand">Envichips</p>
          <p className="print-brand-sub">Distribución de Snacks</p>
        </div>

        <hr className="print-divider" />

        {/* ── Info ── */}
        <div className="print-info">
          <div className="print-info-row">
            <span className="print-label">Pedido:</span>
            <span className="print-value">{pedido.numeroPedido}</span>
          </div>
          <div className="print-info-row">
            <span className="print-label">Fecha:</span>
            <span className="print-value">{formatFecha(pedido.fecha)}</span>
          </div>
          <div className="print-info-row">
            <span className="print-label">Cliente:</span>
            <span className="print-value">
              {pedido.cliente?.nombreCompleto ?? "N/A"}
            </span>
          </div>
          {pedido.domiciliario && (
            <div className="print-info-row">
              <span className="print-label">Domiciliario:</span>
              <span className="print-value">{pedido.domiciliario.nombre}</span>
            </div>
          )}
        </div>

        <hr className="print-divider" />

        {/* ── Products table ── */}
        <table className="print-table">
          <thead>
            <tr>
              <th>CANT</th>
              <th>PRODUCTO</th>
              <th>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {pedido.items.map((item) => (
              <tr key={item.id}>
                <td>{item.cantidad}</td>
                <td>
                  {item.articulo.nombre} {item.articulo.presentacion}
                </td>
                <td>{formatCOP(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr className="print-divider-solid" />

        {/* ── Totals ── */}
        <div className="print-totals">
          <div className="print-total-row">
            <span className="print-label">SUBTOTAL:</span>
            <span className="print-value">{formatCOP(pedido.subtotal)}</span>
          </div>
          <div className="print-total-row">
            <span className="print-label">DESCUENTO:</span>
            <span className="print-value">{formatCOP(pedido.descuento)}</span>
          </div>
          <hr className="print-divider-solid" />
          <div className="print-total-row print-total-final">
            <span className="print-label">TOTAL:</span>
            <span className="print-value">{formatCOP(pedido.total)}</span>
          </div>
        </div>

        <hr className="print-divider-solid" />

        {/* ── Payment method ── */}
        <div className="print-payment">
          Pago: {getMetodoPagoLabel(pedido.metodoPago)}
        </div>

        {/* ── Observations ── */}
        {pedido.observaciones && (
          <div className="print-observations">
            <strong>Observaciones:</strong> {pedido.observaciones}
          </div>
        )}

        <hr className="print-divider" />

        {/* ── Footer ── */}
        <div className="print-footer">
          ¡Gracias por su compra!
        </div>
      </div>
    </div>
  );
}
