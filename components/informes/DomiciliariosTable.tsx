"use client";

import { useSort } from "@/lib/hooks/useSort";
import type { SortFieldConfig } from "@/lib/hooks/useSort";
import { SortBar } from "@/components/ui/sort-controls";
import type { DomiciliarioRow } from "@/lib/services/informes";
import { formatCOP } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DomiciliariosTableProps {
  rows: DomiciliarioRow[];
}

export function DomiciliariosTable({ rows }: DomiciliariosTableProps) {
  const sortFields: SortFieldConfig<DomiciliarioRow>[] = [
    { key: "nombre", label: "Nombre", type: "string" },
    { key: "pedidosEntregados", label: "Entregados", type: "number" },
    { key: "totalVendido", label: "Total Vendido", type: "number" },
    { key: "efectivoRecolectado", label: "Efectivo", type: "number" },
    { key: "transferencias", label: "Transferencias", type: "number" },
    { key: "pedidosCancelados", label: "Cancelados", type: "number" },
    { key: "totalACobrarAdmin", label: "Por Confirmar", type: "number" },
  ];

  const { sorted, sortBy, sortOrder, handleSort, SortIcon } = useSort({
    data: rows,
    config: sortFields,
    defaultSortBy: "totalVendido",
    defaultSortDir: "desc",
  });

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          No hay datos de domiciliarios en este período
        </p>
        <p className="text-sm text-muted-foreground">
          Los datos aparecerán cuando haya pedidos asignados a domiciliarios.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        <SortBar fields={sortFields} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
        {sorted.map((r) => (
          <div key={r.userId} className="rounded-xl border bg-card p-4">
            <div className="font-medium mb-2">{r.nombre}</div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">Pedidos entregados:</span>
              <span className="text-sm font-medium">{r.pedidosEntregados}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">Total vendido:</span>
              <span className="text-sm font-medium tabular-nums">{formatCOP(r.totalVendido)}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">Efectivo recolect.:</span>
              <span className="text-sm font-medium tabular-nums">{formatCOP(r.efectivoRecolectado)}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">Transferencias:</span>
              <span className="text-sm font-medium tabular-nums">{formatCOP(r.transferencias)}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">Cancelados:</span>
              <span className="text-sm font-medium">{r.pedidosCancelados}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">Por confirmar:</span>
              <span className="text-sm font-medium text-amber-600">{formatCOP(r.totalACobrarAdmin)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none min-w-[140px]" onClick={() => handleSort("nombre")}>
                Nombre {SortIcon("nombre")}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("pedidosEntregados")}>
                Entregados {SortIcon("pedidosEntregados")}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("totalVendido")}>
                Total Vendido {SortIcon("totalVendido")}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("efectivoRecolectado")}>
                Efectivo {SortIcon("efectivoRecolectado")}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("transferencias")}>
                Transferencias {SortIcon("transferencias")}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("pedidosCancelados")}>
                Cancelados {SortIcon("pedidosCancelados")}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("totalACobrarAdmin")}>
                Por Confirmar {SortIcon("totalACobrarAdmin")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((r) => (
              <TableRow key={r.userId}>
                <TableCell className="font-medium">{r.nombre}</TableCell>
                <TableCell>{r.pedidosEntregados}</TableCell>
                <TableCell className="tabular-nums">{formatCOP(r.totalVendido)}</TableCell>
                <TableCell className="tabular-nums">{formatCOP(r.efectivoRecolectado)}</TableCell>
                <TableCell className="tabular-nums">{formatCOP(r.transferencias)}</TableCell>
                <TableCell>{r.pedidosCancelados}</TableCell>
                <TableCell className="tabular-nums font-medium text-amber-600">{formatCOP(r.totalACobrarAdmin)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
