import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Package } from "lucide-react";
import {
  getArticuloByIdAction,
  getHistorialArticuloAction,
} from "@/app/dashboard/articulos/actions";
import { formatCOP } from "@/lib/format";

// ─── Types ──────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>;
}

// ─── Generate Metadata ─────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const result = await getArticuloByIdAction(id);

  if ("error" in result) {
    return { title: "Historial | Envichips" };
  }

  return {
    title: `Historial - ${result.data.nombre} | Envichips`,
  };
}

// ─── Page ───────────────────────────────────────────

export default async function HistorialPage({ params }: Props) {
  const { id } = await params;

  const [articuloResult, historialResult] = await Promise.all([
    getArticuloByIdAction(id),
    getHistorialArticuloAction(id),
  ]);

  if ("error" in articuloResult) {
    notFound();
  }

  const articulo = articuloResult.data;
  const movimientos = "data" in historialResult ? historialResult.data : [];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* ─── Back link ─── */}
      <Link
        href="/dashboard/articulos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Volver a Artículos
      </Link>

      {/* ─── Header ─── */}
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Package className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">{articulo.nombre}</h1>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm text-muted-foreground">Stock:</span>
              <span className="text-2xl font-bold sm:text-3xl">{articulo.stockActual}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Precio: {formatCOP(articulo.precio)}
            </span>
            <span className="text-sm text-muted-foreground">
              Costo: {formatCOP(articulo.costo)}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Empty state ─── */}
      {movimientos.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/5 text-primary/40">
            <Package className="size-7" />
          </span>
          <p className="text-sm font-medium text-foreground">
            Sin movimientos registrados
          </p>
          <p className="text-xs text-muted-foreground">
            Los movimientos aparecerán al comprar o vender este artículo
          </p>
        </div>
      )}

      {/* ─── Timeline ─── */}
      {movimientos.length > 0 && (
        <div className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-2 before:h-[calc(100%-1rem)] before:w-0.5 before:bg-border">
          {movimientos.map((mov, i) => (
            <div key={i} className="relative">
              {/* Colored dot */}
              <div
                className={`absolute -left-[22px] top-1.5 size-3 rounded-full border-2 ${
                  mov.tipo === "entrada"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-red-500 bg-red-50"
                }`}
              />

              {/* Content card */}
              <div className="rounded-lg border bg-card p-4 text-sm shadow-xs">
                {/* Date + Type badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {mov.fecha.toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      mov.tipo === "entrada"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {mov.tipo === "entrada" ? "Entrada" : "Salida"}
                  </span>
                </div>

                {/* Quantity */}
                <p className="mt-1 font-medium">
                  {mov.tipo === "entrada" ? "+" : "-"}
                  {mov.cantidad} unidades
                </p>

                {/* Reference + Stock resultante */}
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{mov.referencia}</span>
                  <span className="tabular-nums font-medium">
                    Stock: {mov.stockResultante}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
