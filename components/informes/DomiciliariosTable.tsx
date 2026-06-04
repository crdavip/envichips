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

type SortField = "pedidosEntregados" | "totalVendido" | "efectivoRecolectado" | "transferencias" | "pedidosCancelados";
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
    <div className="rounded-xl border bg-card">
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
