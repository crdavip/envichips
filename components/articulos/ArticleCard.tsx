"use client";

import { Pencil, Power, PowerOff } from "lucide-react";
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
  onEdit?: (articulo: Articulo) => void;
  onToggleActivo?: (articulo: Articulo) => void;
  canMutate?: boolean;
}

export function ArticleCard({ articulo, onEdit, onToggleActivo, canMutate = true }: ArticleCardProps) {
  const ganancia = articulo.precio - articulo.costo;

  return (
    <div
      className={cn(
        "flex cursor-pointer flex-col gap-2.5 rounded-xl border bg-card p-5 text-sm shadow-xs transition-all hover:shadow-md",
        !articulo.activo && "opacity-50",
      )}
      onClick={() => { if (canMutate && onEdit) onEdit(articulo); }}
      role={canMutate ? "button" : undefined}
      tabIndex={canMutate ? 0 : -1}
      onKeyDown={(e) => {
        if (!canMutate) return;
        if (e.key === "Enter" || e.key === " ") onEdit && onEdit(articulo);
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

        <div className="flex shrink-0 items-center gap-0.5">
          {!articulo.activo && (
            <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
              Inactivo
            </span>
          )}
          {canMutate && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit && onEdit(articulo); }}
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                title="Editar artículo"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleActivo && onToggleActivo(articulo); }}
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                title={articulo.activo ? "Desactivar artículo" : "Reactivar artículo"}
              >
                {articulo.activo ? (
                  <PowerOff className="size-3.5" />
                ) : (
                  <Power className="size-3.5 text-emerald-500" />
                )}
              </button>
            </>
          )}
        </div>
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
      <div className="pt-2">
        <StockBadge
          stockActual={articulo.stockActual}
          stockMinimo={articulo.stockMinimo}
        />
      </div>
    </div>
  );
}
