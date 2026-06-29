"use client";

import { useSort } from "@/lib/hooks/useSort";
import type { SortFieldConfig } from "@/lib/hooks/useSort";
import { SortBar } from "@/components/ui/sort-controls";
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

interface VentasTableProps {
  productos: VentasPorProducto[];
}

export function VentasTable({ productos }: VentasTableProps) {
  const sortFields: SortFieldConfig<VentasPorProducto>[] = [
    {
      key: "nombre",
      label: "Producto",
      type: "string",
      accessor: (p: VentasPorProducto) => `${p.nombre} ${p.presentacion}`,
    },
    { key: "unidadesVendidas", label: "Unidades", type: "number" },
    { key: "ingresos", label: "Ingresos", type: "number" },
    { key: "ganancia", label: "Ganancia", type: "number" },
    { key: "porcentajeDelTotal", label: "% del total", type: "number" },
  ];

  const { sorted, sortBy, sortOrder, handleSort, SortIcon } = useSort({
    data: productos,
    config: sortFields,
    defaultSortBy: "unidadesVendidas",
    defaultSortDir: "desc",
  });

  if (productos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <p className="text-lg font-medium text-muted-foreground">No hay ventas en este período</p>
        <p className="text-sm text-muted-foreground">Los datos aparecerán cuando haya pedidos entregados.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        <SortBar fields={sortFields} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
        {sorted.map((p) => (
          <div key={p.articuloId} className="rounded-xl border bg-card p-4">
            <div className="font-medium mb-2">
              {p.nombre}{" "}
              <span className="text-xs text-muted-foreground">{p.presentacion}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">Unidades:</span>
              <span className="text-sm font-medium">{p.unidadesVendidas}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">Ingresos:</span>
              <span className="text-sm font-medium">{formatCOP(p.ingresos)}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">Ganancia:</span>
              <span className="text-sm font-medium">{formatCOP(p.ganancia)}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">% del total:</span>
              <span className="text-sm font-medium">{p.porcentajeDelTotal.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-4 dark:bg-gray-700 mt-2">
              <div
                className="bg-blue-500 h-4 rounded-full transition-all"
                style={{ width: `${Math.min(p.porcentajeDelTotal, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none min-w-[180px]" onClick={() => handleSort("nombre")}>
                Producto {SortIcon("nombre")}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("unidadesVendidas")}>
                Unidades {SortIcon("unidadesVendidas")}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("ingresos")}>
                Ingresos {SortIcon("ingresos")}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("ganancia")}>
                Ganancia {SortIcon("ganancia")}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("porcentajeDelTotal")}>
                % del total {SortIcon("porcentajeDelTotal")}
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
    </>
  );
}
