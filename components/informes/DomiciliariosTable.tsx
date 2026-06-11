"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
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

type SortField = "pedidosEntregados" | "totalVendido" | "efectivoRecolectado" | "transferencias" | "pedidosCancelados" | "totalACobrarAdmin";
type SortDir = "asc" | "desc";

function SortIcon({ field, sortBy, sortDir }: { field: SortField; sortBy: SortField; sortDir: SortDir }) {
  if (sortBy !== field) return null;
  return sortDir === "asc" ? <ArrowUp className="inline size-3" /> : <ArrowDown className="inline size-3" />;
}

interface DomiciliariosTableProps {
  rows: DomiciliarioRow[];
}

export function DomiciliariosTable({ rows }: DomiciliariosTableProps) {
  const [sortBy, setSortBy] = useState<SortField>("totalVendido");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [rows, sortBy, sortDir]);

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

  const thClass = "cursor-pointer select-none";

  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
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
              <TableHead className="min-w-[140px]">Nombre</TableHead>
              <TableHead className={thClass} onClick={() => toggleSort("pedidosEntregados")}>
                Entregados <SortIcon field="pedidosEntregados" sortBy={sortBy} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort("totalVendido")}>
                Total Vendido <SortIcon field="totalVendido" sortBy={sortBy} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort("efectivoRecolectado")}>
                Efectivo <SortIcon field="efectivoRecolectado" sortBy={sortBy} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort("transferencias")}>
                Transferencias <SortIcon field="transferencias" sortBy={sortBy} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort("pedidosCancelados")}>
                Cancelados <SortIcon field="pedidosCancelados" sortBy={sortBy} sortDir={sortDir} />
              </TableHead>
              <TableHead className={thClass} onClick={() => toggleSort("totalACobrarAdmin")}>
                Por Confirmar <SortIcon field="totalACobrarAdmin" sortBy={sortBy} sortDir={sortDir} />
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
