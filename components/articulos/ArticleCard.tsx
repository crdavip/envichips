"use client";

import type { Articulo } from "@/lib/generated/prisma/client";
import { StockBadge } from "@/components/articulos/StockBadge";
import { cn } from "@/lib/utils";

const formatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

interface ArticleCardProps {
  articulo: Articulo;
  onEdit: (articulo: Articulo) => void;
  onToggleActivo: (articulo: Articulo) => void;
}

export function ArticleCard({ articulo, onEdit, onToggleActivo }: ArticleCardProps) {
  const ganancia = articulo.precio - articulo.costo;

  return (
    <div
      className={cn(
        "flex cursor-pointer flex-col gap-2 rounded-xl border bg-card p-4 text-sm shadow-xs transition-all hover:shadow-md",
        !articulo.activo && "opacity-50",
      )}
      onClick={() => onEdit(articulo)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onEdit(articulo);
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-foreground">
            {articulo.nombre}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {articulo.categoria} · {articulo.presentacion}
          </p>
        </div>

        {!articulo.activo && (
          <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
            Inactivo
          </span>
        )}
      </div>

      {/* Info rows */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Precio</span>
        <span className="font-medium">{formatter.format(articulo.precio)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Ganancia</span>
        <span className="font-medium text-emerald-600">
          {formatter.format(ganancia)}
        </span>
      </div>

      {/* Stock badge */}
      <div className="flex items-center justify-between pt-1">
        <StockBadge
          stockActual={articulo.stockActual}
          stockMinimo={articulo.stockMinimo}
        />

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleActivo(articulo);
          }}
          className="cursor-pointer text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          type="button"
        >
          {articulo.activo ? "Desactivar" : "Activar"}
        </button>
      </div>
    </div>
  );
}
