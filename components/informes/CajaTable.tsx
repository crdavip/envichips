"use client";

import { useMemo, useState } from "react";
import type { Movimiento } from "@/lib/generated/prisma/client";
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
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 20;

const TIPO_LABEL: Record<string, string> = {
  INGRESO: "Ingreso",
  GASTO: "Gasto",
  PRESTAMO: "Préstamo",
};

const TIPO_VARIANT: Record<string, "success" | "destructive" | "warning"> = {
  INGRESO: "success",
  GASTO: "destructive",
  PRESTAMO: "warning",
};

const CATEGORIA_LABEL: Record<string, string> = {
  COMPRA_MERCANCIA: "Compra Mercancía",
  PAGO_DOMICILIARIO: "Pago Domiciliario",
  ARRIENDO: "Arriendo",
  SERVICIOS: "Servicios",
  COBRO_CARTERA: "Cobro Cartera",
  PRESTAMO: "Préstamo",
  OTRO: "Otro",
};

const METODO_PAGO_LABEL: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  FIADO: "Fiado",
};

interface CajaTableProps {
  movimientos: Movimiento[];
}

export function CajaTable({ movimientos }: CajaTableProps) {
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(movimientos.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);

  const pageItems = useMemo(() => {
    const start = safePage * ITEMS_PER_PAGE;
    return movimientos.slice(start, start + ITEMS_PER_PAGE);
  }, [movimientos, safePage]);

  if (movimientos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          No hay movimientos en este período
        </p>
        <p className="text-sm text-muted-foreground">
          Crea un nuevo movimiento usando el botón de arriba.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {pageItems.map((m) => (
          <div key={m.id} className="rounded-xl border bg-card p-4">
            <div className="font-medium mb-1">
              {new Date(m.fecha).toLocaleDateString("es-CO", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={TIPO_VARIANT[m.tipo] ?? "default"}>
                {TIPO_LABEL[m.tipo] ?? m.tipo}
              </Badge>
              <span className="text-sm text-muted-foreground">{CATEGORIA_LABEL[m.categoria] ?? m.categoria}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">Monto:</span>
              <span className="text-sm font-medium tabular-nums">{formatCOP(m.monto)}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">Descripción:</span>
              <span className="text-sm font-medium">{m.descripcion}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">Método:</span>
              <span className="text-sm font-medium">{METODO_PAGO_LABEL[m.metodoPago] ?? m.metodoPago}</span>
            </div>
          </div>
        ))}
        {movimientos.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {safePage * ITEMS_PER_PAGE + 1}–{Math.min((safePage + 1) * ITEMS_PER_PAGE, movimientos.length)} de{" "}
              {movimientos.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="xs"
                disabled={safePage === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="size-3" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(0, safePage - 2);
                const pageNum = start + i;
                if (pageNum >= totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === safePage ? "default" : "outline"}
                    size="xs"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum + 1}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="xs"
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="size-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop table + pagination */}
      <div className="hidden md:block rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="hidden sm:table-cell">Descripción</TableHead>
              <TableHead className="hidden md:table-cell">Método Pago</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="whitespace-nowrap">
                  {new Date(m.fecha).toLocaleDateString("es-CO", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant={TIPO_VARIANT[m.tipo] ?? "default"}>
                    {TIPO_LABEL[m.tipo] ?? m.tipo}
                  </Badge>
                </TableCell>
                <TableCell>{CATEGORIA_LABEL[m.categoria] ?? m.categoria}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCOP(m.monto)}
                </TableCell>
                <TableCell className="hidden max-w-[200px] truncate sm:table-cell text-muted-foreground">
                  {m.descripcion}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {METODO_PAGO_LABEL[m.metodoPago] ?? m.metodoPago}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {movimientos.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {safePage * ITEMS_PER_PAGE + 1}–{Math.min((safePage + 1) * ITEMS_PER_PAGE, movimientos.length)} de{" "}
              {movimientos.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="xs"
                disabled={safePage === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="size-3" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(0, safePage - 2);
                const pageNum = start + i;
                if (pageNum >= totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === safePage ? "default" : "outline"}
                    size="xs"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum + 1}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="xs"
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="size-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
