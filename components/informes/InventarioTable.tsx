"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { InventarioRow } from "@/lib/services/informes";
import { formatCOP } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SortField = "nombre" | "ingresos" | "egresos" | "stockActual" | "stockMinimo" | "valorInventario";
type SortDir = "asc" | "desc";

function SortIcon({ field, sortBy, sortDir }: { field: SortField; sortBy: SortField; sortDir: SortDir }) {
  if (sortBy !== field) return null;
  return sortDir === "asc" ? <ArrowUp className="inline size-3" /> : <ArrowDown className="inline size-3" />;
}

function StockBadge({ estado }: { estado: InventarioRow["estado"] }) {
  const config = {
    OK: { variant: "success" as const, label: "Stock OK" },
    BAJO: { variant: "warning" as const, label: "Stock Bajo" },
    SIN_STOCK: { variant: "destructive" as const, label: "Sin Stock" },
  } as const;
  const { variant, label } = config[estado];
  return <Badge variant={variant}>{label}</Badge>;
}

interface InventarioTableProps {
  rows: InventarioRow[];
}

export function InventarioTable({ rows }: InventarioTableProps) {
  const [sortBy, setSortBy] = useState<SortField>("stockActual");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  const sorted = [...rows].sort((a, b) => {
    let aVal: string | number = a[sortBy];
    let bVal: string | number = b[sortBy];
    if (typeof aVal === "string") {
      return sortDir === "asc" ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
    }
    return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const thClass = "cursor-pointer select-none";

  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {sorted.map((r) => {
          const cardColor = r.estado === "SIN_STOCK" ? "text-red-600" : r.estado === "BAJO" ? "text-amber-600" : "";
          return (
            <div key={r.id} className={`rounded-xl border bg-card p-4 ${cardColor}`}>
              <div className="font-medium mb-2">
                {r.nombre}{" "}
                <span className="text-xs text-muted-foreground">{r.presentacion}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">Stock:</span>
                <span className="text-sm font-semibold">{r.stockActual} / {r.stockMinimo} und</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">Estado:</span>
                <StockBadge estado={r.estado} />
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">Valor Inv.:</span>
                <span className="text-sm font-medium">{formatCOP(r.valorInventario)}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">Ingresos:</span>
                <span className="text-sm font-medium">{r.ingresos} und</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">Egresos:</span>
                <span className="text-sm font-medium">{r.egresos} und</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={`min-w-[160px] ${thClass}`} onClick={() => toggleSort("nombre")}>
                Producto <SortIcon field="nombre" sortBy={sortBy} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort("ingresos")}>
                Ingresos <SortIcon field="ingresos" sortBy={sortBy} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort("egresos")}>
                Egresos <SortIcon field="egresos" sortBy={sortBy} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort("stockActual")}>
                Stock Actual <SortIcon field="stockActual" sortBy={sortBy} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort("stockMinimo")}>
                Stock Mínimo <SortIcon field="stockMinimo" sortBy={sortBy} sortDir={sortDir} />
              </TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className={thClass} onClick={() => toggleSort("valorInventario")}>
                Valor Inventario <SortIcon field="valorInventario" sortBy={sortBy} sortDir={sortDir} />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((r) => {
              const rowColor = r.estado === "SIN_STOCK" ? "text-red-600" : r.estado === "BAJO" ? "text-amber-600" : "";
              return (
                <TableRow key={r.id} className={rowColor}>
                  <TableCell className="font-medium">
                    {r.nombre}{" "}
                    <span className="text-xs text-muted-foreground">{r.presentacion}</span>
                  </TableCell>
                  <TableCell>{r.ingresos}</TableCell>
                  <TableCell>{r.egresos}</TableCell>
                  <TableCell className="font-semibold">{r.stockActual}</TableCell>
                  <TableCell>{r.stockMinimo}</TableCell>
                  <TableCell>
                    <StockBadge estado={r.estado} />
                  </TableCell>
                  <TableCell>{formatCOP(r.valorInventario)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
