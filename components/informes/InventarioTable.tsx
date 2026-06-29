"use client";

import { useSort } from "@/lib/hooks/useSort";
import type { SortFieldConfig } from "@/lib/hooks/useSort";
import { SortBar } from "@/components/ui/sort-controls";
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
  const sortFields: SortFieldConfig<InventarioRow>[] = [
    { key: "nombre", label: "Nombre", type: "string" },
    { key: "ingresos", label: "Ingresos", type: "number" },
    { key: "egresos", label: "Egresos", type: "number" },
    { key: "stockActual", label: "Stock Actual", type: "number" },
    { key: "stockMinimo", label: "Stock Mínimo", type: "number" },
    { key: "estado", label: "Estado", type: "string" },
    { key: "valorInventario", label: "Valor Inventario", type: "number" },
  ];

  const { sorted, sortBy, sortOrder, handleSort, SortIcon } = useSort({
    data: rows,
    config: sortFields,
    defaultSortBy: "nombre",
  });

  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        <SortBar fields={sortFields} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
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
              <TableHead className="cursor-pointer select-none min-w-[160px]" onClick={() => handleSort("nombre")}>
                Producto {SortIcon("nombre")}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("ingresos")}>
                Ingresos {SortIcon("ingresos")}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("egresos")}>
                Egresos {SortIcon("egresos")}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("stockActual")}>
                Stock Actual {SortIcon("stockActual")}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("stockMinimo")}>
                Stock Mínimo {SortIcon("stockMinimo")}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("estado")}>
                Estado {SortIcon("estado")}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("valorInventario")}>
                Valor Inventario {SortIcon("valorInventario")}
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
