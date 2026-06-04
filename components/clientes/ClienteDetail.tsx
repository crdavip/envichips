"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Plus } from "lucide-react";
import type { Cliente, Abono } from "@/lib/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCOP } from "@/lib/format";
import { ClienteForm } from "./ClienteForm";
import { AbonoForm } from "./AbonoForm";

// ─── Types ──────────────────────────────────────────────

export type ClienteDetailData = Cliente & {
  deuda: number;
  abonos: Abono[];
};

interface ClienteDetailProps {
  cliente: ClienteDetailData;
  userRole?: string;
}

// ─── Helpers ────────────────────────────────────────────

const METODO_PAGO_LABEL: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  FIADO: "Fiado",
};

function formatFecha(date: string | Date): string {
  return new Date(date).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Component ──────────────────────────────────────────

export function ClienteDetail({ cliente, userRole }: ClienteDetailProps) {
  const router = useRouter();
  const canMutate =
    userRole === "SUPERADMIN" || userRole === "ADMIN";

  // ── Dialog state ──
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAbonoForm, setShowAbonoForm] = useState(false);

  // ── Callbacks ──
  const handleEditSuccess = useCallback(() => {
    setShowEditForm(false);
    router.refresh();
  }, [router]);

  const handleAbonoSuccess = useCallback(() => {
    setShowAbonoForm(false);
    router.refresh();
  }, [router]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {/* ── Back button ── */}
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="size-4" />
        Volver
      </Button>

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {cliente.nombreCompleto}
            </h1>
            {cliente.deuda === 0 ? (
              <Badge variant="success">AL DÍA</Badge>
            ) : (
              <Badge variant="destructive">EN DEUDA</Badge>
            )}
          </div>
          <p className="font-mono text-sm text-muted-foreground">
            {cliente.idCliente}
          </p>
        </div>

        {canMutate && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowEditForm(true)}
            >
              <Edit className="size-4" />
              Editar
            </Button>
            <Button size="sm" onClick={() => setShowAbonoForm(true)}>
              <Plus className="size-4" />
              Registrar Abono
            </Button>
          </div>
        )}
      </div>

      {/* ── Info Section ── */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Nombre Completo
              </dt>
              <dd className="text-sm">{cliente.nombreCompleto}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Teléfono
              </dt>
              <dd className="text-sm">{cliente.telefono ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Dirección
              </dt>
              <dd className="text-sm">{cliente.direccion ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Documento
              </dt>
              <dd className="text-sm">
                {cliente.tipoDoc && cliente.numeroDoc
                  ? `${cliente.tipoDoc} ${cliente.numeroDoc}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Registrado
              </dt>
              <dd className="text-sm">
                {formatFecha(cliente.creadoEn)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* ── Deuda Section ── */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Cartera</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-8">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Deuda Actual
              </dt>
              <dd
                className={`text-2xl font-bold ${
                  cliente.deuda > 0 ? "text-destructive" : "text-emerald-600"
                }`}
              >
                {formatCOP(cliente.deuda)}
              </dd>
            </div>
            {cliente.limiteCredito != null && cliente.limiteCredito > 0 && (
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Límite de Crédito
                </dt>
                <dd className="text-lg font-semibold">
                  {formatCOP(cliente.limiteCredito)}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Estado
              </dt>
              <dd className="mt-1">
                {cliente.deuda === 0 ? (
                  <Badge variant="success">AL DÍA</Badge>
                ) : (
                  <Badge variant="destructive">EN DEUDA</Badge>
                )}
              </dd>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Abono History ── */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Abonos</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:px-4">
          {cliente.abonos.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground sm:px-0">
              No hay abonos registrados
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método de Pago</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cliente.abonos.map((abono) => (
                  <TableRow key={abono.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatFecha(abono.fecha)}
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">
                      {formatCOP(abono.monto)}
                    </TableCell>
                    <TableCell>
                      {METODO_PAGO_LABEL[abono.metodoPago] ?? abono.metodoPago}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {abono.notas ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Edit Cliente Dialog ── */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Actualiza los datos del cliente
            </DialogDescription>
          </DialogHeader>
          <DialogClose onClick={() => setShowEditForm(false)} />

          <ClienteForm
            mode="edit"
            initialData={cliente}
            onSuccess={handleEditSuccess}
            onCancel={() => setShowEditForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* ── Register Abono Dialog ── */}
      <AbonoForm
        clienteId={cliente.id}
        open={showAbonoForm}
        onOpenChange={setShowAbonoForm}
        onSuccess={handleAbonoSuccess}
      />
    </div>
  );
}
