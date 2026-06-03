"use client";

import { Pencil, Power, PowerOff } from "lucide-react";
import type { Articulo } from "@/lib/generated/prisma/client";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StockBadge } from "@/components/articulos/StockBadge";
import { cn } from "@/lib/utils";

const formatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

interface ArticleRowProps {
  articulo: Articulo;
  onEdit: (articulo: Articulo) => void;
  onToggleActivo: (articulo: Articulo) => void;
}

export function ArticleRow({ articulo, onEdit, onToggleActivo }: ArticleRowProps) {
  const ganancia = articulo.precio - articulo.costo;

  return (
    <TableRow
      className={cn(
        !articulo.activo && "opacity-50",
      )}
    >
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {articulo.nombre}
          {!articulo.activo && (
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
              Inactivo
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>{articulo.categoria}</TableCell>
      <TableCell>{articulo.presentacion}</TableCell>
      <TableCell className="tabular-nums">
        {formatter.format(articulo.costo)}
      </TableCell>
      <TableCell className="tabular-nums">
        {formatter.format(articulo.precio)}
      </TableCell>
      <TableCell className="tabular-nums text-emerald-600">
        {formatter.format(ganancia)}
      </TableCell>
      <TableCell className="tabular-nums">
        {articulo.stockActual}
      </TableCell>
      <TableCell>
        <StockBadge
          stockActual={articulo.stockActual}
          stockMinimo={articulo.stockMinimo}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onEdit(articulo)}
            title="Editar artículo"
            className="cursor-pointer"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onToggleActivo(articulo)}
            title={articulo.activo ? "Desactivar artículo" : "Reactivar artículo"}
            className="cursor-pointer"
          >
            {articulo.activo ? (
              <PowerOff className="size-3.5 text-muted-foreground" />
            ) : (
              <Power className="size-3.5 text-emerald-500" />
            )}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
