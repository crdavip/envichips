"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Edit, Plus } from "lucide-react";
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
import { RegistrarVisitaForm } from "./RegistrarVisitaForm";

// ─── Helpers ────────────────────────────────────────────

function daysSince(date: Date | string | null): number | null {
  if (!date) return null;
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

interface HistorialVisitaItem {
  id: string;
  fecha: string;
  notas: string | null;
  user: { id: string; nombre: string } | null;
}

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
  const [showVisitaForm, setShowVisitaForm] = useState(false);

  // ── Callbacks ──
  const handleEditSuccess = useCallback(() => {
    setShowEditForm(false);
    router.refresh();
  }, [router]);

  const handleAbonoSuccess = useCallback(() => {
    setShowAbonoForm(false);
    router.refresh();
  }, [router]);

  const handleVisitaSuccess = useCallback(() => {
    setShowVisitaForm(false);
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

      {/* ── Visitas Section ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Visitas</CardTitle>
          {canMutate && (
            <Button size="sm" onClick={() => setShowVisitaForm(true)}>
              <Plus className="size-4" />
              Registrar Visita
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {(() => {
            const clienteData = cliente as ClienteDetailData & { ultimaVisita: string | null; historialVisitas: HistorialVisitaItem[] };
            const days = daysSince(clienteData.ultimaVisita);
            return (
              <div className="space-y-4">
                {/* Last visit summary */}
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">
                    Última visita
                  </dt>
                  <dd className="mt-0.5">
                    {clienteData.ultimaVisita ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          Hace {days} día{days === 1 ? "" : "s"}
                        </span>
                        {days !== null && days > 7 ? (
                          <Badge variant="destructive">Pendiente</Badge>
                        ) : (
                          <Badge variant="success">Reciente</Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Sin visitas registradas
                      </span>
                    )}
                  </dd>
                </div>

                {/* Visit history */}
                {clienteData.historialVisitas.length > 0 && (
                  <div className="border-t pt-3">
                    <dt className="text-xs font-medium text-muted-foreground mb-2">
                      Historial de visitas
                    </dt>
                    <div className="space-y-2">
                      {clienteData.historialVisitas.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-start gap-3 rounded-lg bg-muted/50 p-3"
                        >
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Calendar className="size-3.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium">
                              {new Date(v.fecha).toLocaleDateString("es-CO", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            {v.user && (
                              <p className="text-xs text-muted-foreground">
                                por {v.user.nombre}
                              </p>
                            )}
                            {v.notas && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {v.notas}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {clienteData.historialVisitas.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No hay visitas registradas anteriormente
                  </p>
                )}
              </div>
            );
          })()}
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

      {/* ── Register Visita Dialog ── */}
      <RegistrarVisitaForm
        clienteId={cliente.id}
        open={showVisitaForm}
        onOpenChange={setShowVisitaForm}
        onSuccess={handleVisitaSuccess}
      />
    </div>
  );
}
