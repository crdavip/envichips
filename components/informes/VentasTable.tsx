"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { VentasPorProducto } from "@/lib/services/informes";
import { formatCOP } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SortField = "unidadesVendidas" | "ingresos" | "ganancia" | "porcentajeDelTotal";
type SortDir = "asc" | "desc";

function SortIcon({ field, sortBy, sortDir }: { field: SortField; sortBy: SortField; sortDir: SortDir }) {
  if (sortBy !== field) return null;
  return sortDir === "asc" ? <ArrowUp className="inline size-3" /> : <ArrowDown className="inline size-3" />;
}

interface VentasTableProps {
  productos: VentasPorProducto[];
}

export function VentasTable({ productos }: VentasTableProps) {
  const [sortBy, setSortBy] = useState<SortField>("unidadesVendidas");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  const maxIngreso = useMemo(
    () => Math.max(...productos.map((p) => p.ingresos), 0),
    [productos],
  );

  const sorted = useMemo(() => {
    return [...productos].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [productos, sortBy, sortDir]);

  if (productos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <p className="text-lg font-medium text-muted-foreground">No hay ventas en este período</p>
        <p className="text-sm text-muted-foreground">Los datos aparecerán cuando haya pedidos entregados.</p>
      </div>
    );
  }

  const columns: { label: string; field: SortField; className?: string }[] = [
    { label: "Producto", field: "unidadesVendidas", className: "text-left min-w-[180px]" },
    { label: "Unidades", field: "unidadesVendidas" },
    { label: "Ingresos", field: "ingresos" },
    { label: "Ganancia", field: "ganancia" },
    { label: "% del total", field: "porcentajeDelTotal" },
  ];

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[180px]">Producto</TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("unidadesVendidas")}>
              Unidades <SortIcon field="unidadesVendidas" sortBy={sortBy} sortDir={sortDir} />
            </TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("ingresos")}>
              Ingresos <SortIcon field="ingresos" sortBy={sortBy} sortDir={sortDir} />
            </TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("ganancia")}>
              Ganancia <SortIcon field="ganancia" sortBy={sortBy} sortDir={sortDir} />
            </TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("porcentajeDelTotal")}>
              % del total <SortIcon field="porcentajeDelTotal" sortBy={sortBy} sortDir={sortDir} />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((p) => (
            <TableRow key={p.articuloId}>
              <TableCell className="font-medium">
                {p.nombre}{" "}
                <span className="text-xs text-muted-foreground">{p.presentacion}</span>
              </TableCell>
              <TableCell>{p.unidadesVendidas}</TableCell>
              <TableCell>{formatCOP(p.ingresos)}</TableCell>
              <TableCell>{formatCOP(p.ganancia)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-full max-w-[120px] bg-gray-100 rounded-full h-4 dark:bg-gray-700">
                    <div
                      className="bg-blue-500 h-4 rounded-full transition-all"
                      style={{ width: `${Math.min(p.porcentajeDelTotal, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums shrink-0">
                    {p.porcentajeDelTotal.toFixed(1)}%
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
