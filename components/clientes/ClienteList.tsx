"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Phone,
  Search,
  Users,
  Plus,
  RefreshCw,
  ExternalLink,
  PowerOff,
} from "lucide-react";
import type { Cliente } from "@/lib/generated/prisma/client";
import {
  deleteClienteAction,
  getClientesAction,
} from "@/app/(dashboard)/clientes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectList,
  SelectItem,
} from "@/components/ui/select";
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
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { ClienteForm } from "./ClienteForm";

// ─── Types ──────────────────────────────────────────

interface ClienteRow {
  id: string;
  idCliente: string;
  nombreCompleto: string;
  telefono: string | null;
  estado: string;
  deuda: number;
  creadoEn: Date;
}

type SortField = "nombreCompleto" | "creadoEn";

interface ClienteFiltersState {
  nombre?: string;
  telefono?: string;
  estado?: "AL_DIA" | "EN_DEUDA";
}

// ─── Deuda Badge ────────────────────────────────────

function DeudaBadge({ deuda }: { deuda: number }) {
  if (deuda === 0) {
    return <Badge variant="success">AL DÍA</Badge>;
  }
  return <Badge variant="destructive">EN DEUDA</Badge>;
}

// ─── Sort icon helper ─────────────────────────────────

function SortIcon({
  field,
  sortBy,
  sortOrder,
}: {
  field: string;
  sortBy: string;
  sortOrder: string;
}) {
  if (sortBy !== field) return null;
  return sortOrder === "asc" ? (
    <ArrowUp className="inline size-3" />
  ) : (
    <ArrowDown className="inline size-3" />
  );
}

// ─── Format currency ─────────────────────────────────

function formatCOP(amount: number): string {
  return `$${amount.toLocaleString("es-CO")}`;
}

// ─── Component ──────────────────────────────────────

interface ClienteListProps {
  userRole?: string;
}

export function ClienteList({ userRole }: ClienteListProps) {
  const router = useRouter();
  const canMutate =
    userRole === "SUPERADMIN" || userRole === "ADMIN";

  // ── Form dialog state ──
  const [formMode, setFormMode] = useState<"closed" | "create">("closed");

  // ── Data ──
  const [clientes, setClientes] = useState<ClienteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  // ── Filters ──
  const [filters, setFilters] = useState<ClienteFiltersState>({});
  const [nombreSearch, setNombreSearch] = useState("");
  const [telefonoSearch, setTelefonoSearch] = useState("");

  // ── Sort ──
  const [sortBy, setSortBy] = useState<SortField>("nombreCompleto");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // ── Fetch clientes ──
  const fetchClientes = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const result = await getClientesAction();
      if ("error" in result) {
        setError(result.error);
      } else {
        setClientes(result.data);
      }
    } catch {
      setError("Error al cargar los clientes");
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }, []);

  // ── Form handlers ──
  const handleFormSuccess = useCallback(() => {
    setFormMode("closed");
    fetchClientes();
  }, [fetchClientes]);

  const handleFormClose = useCallback(() => {
    setFormMode("closed");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchClientes(), 0);
    return () => clearTimeout(timer);
  }, [fetchClientes]);

  // ── Client-side filtering + sorting ──
  const filtered = [...clientes]
    .filter((c) => {
      if (filters.nombre) {
        const q = filters.nombre.toLowerCase();
        if (!c.nombreCompleto.toLowerCase().includes(q)) return false;
      }
      if (filters.telefono) {
        const q = filters.telefono.toLowerCase();
        if (!c.telefono?.toLowerCase().includes(q)) return false;
      }
      if (filters.estado && c.estado !== filters.estado) return false;
      return true;
    })
    .sort((a, b) => {
      const dir = sortOrder === "asc" ? 1 : -1;
      switch (sortBy) {
        case "creadoEn":
          return (a.creadoEn.getTime() - b.creadoEn.getTime()) * dir;
        default:
          return a.nombreCompleto.localeCompare(b.nombreCompleto) * dir;
      }
    });

  // ── Filter handlers ──
  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNombreSearch(value);
    setFilters((prev) => ({ ...prev, nombre: value || undefined }));
  };

  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTelefonoSearch(value);
    setFilters((prev) => ({ ...prev, telefono: value || undefined }));
  };

  // ── Delete handler ──
  const handleDelete = async (cliente: ClienteRow) => {
    if (
      !window.confirm(
        `¿Estás seguro de desactivar a "${cliente.nombreCompleto}"?`,
      )
    ) {
      return;
    }

    const result = await deleteClienteAction(cliente.id);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    fetchClientes();
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-8 w-28" />
        </div>

        {/* Filters skeleton */}
        <div className="flex gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-40" />
        </div>

        {/* Table skeleton */}
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state (no data loaded) ──
  if (error && clientes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={fetchClientes}>
          <RefreshCw className="size-4" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">Clientes</h1>
            <p className="text-sm text-muted-foreground">
              Cartera de clientes — {filtered.length} de {clientes.length}{" "}
              clientes
            </p>
          </div>
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        {/* Nombre filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Nombre
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre..."
              value={nombreSearch}
              onChange={handleNombreChange}
              className="w-full pl-8 sm:w-48"
            />
          </div>
        </div>

        {/* Estado filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Estado
          </label>
          <SelectRoot
            value={filters.estado ?? "__all__"}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                estado:
                  value === "__all__" ? undefined : (value as "AL_DIA" | "EN_DEUDA"),
              }))
            }
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Todos">
                {filters.estado ?? "Todos"}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectList>
                <SelectItem value="__all__">Todos</SelectItem>
                <SelectItem value="AL_DIA">AL DÍA</SelectItem>
                <SelectItem value="EN_DEUDA">EN DEUDA</SelectItem>
              </SelectList>
            </SelectPopup>
          </SelectRoot>
        </div>

        {/* Teléfono filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Teléfono
          </label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por teléfono..."
              value={telefonoSearch}
              onChange={handleTelefonoChange}
              className="w-full pl-8 sm:w-44"
            />
          </div>
        </div>
      </div>

      {/* ─── Error banner (with existing data) ─── */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <span>{error}</span>
          <Button
            variant="ghost"
            size="xs"
            onClick={fetchClientes}
            disabled={fetching}
          >
            <RefreshCw className="size-3" />
            Reintentar
          </Button>
        </div>
      )}

      {/* ─── Empty state ─── */}
      {filtered.length === 0 && !fetching && (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/5 text-primary/40">
            <Users className="size-7" />
          </span>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {clientes.length === 0
                ? "No hay clientes registrados"
                : "Ningún cliente coincide con los filtros"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {clientes.length === 0
                ? "Creá tu primer cliente para empezar"
                : "Probá con otros filtros o palabras clave"}
            </p>
          </div>
          {clientes.length === 0 && canMutate && (
            <Button onClick={() => setFormMode("create")}>
              <Plus className="size-4" />
              Crear primer cliente
            </Button>
          )}
        </div>
      )}

      {/* ─── Mobile cards ─── */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
          {filtered.map((cliente) => (
            <ClienteCard
              key={cliente.id}
              cliente={cliente}
              canMutate={canMutate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ─── Desktop table ─── */}
      {filtered.length > 0 && (
        <div className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("nombreCompleto")}
                >
                  Nombre{" "}
                  <SortIcon
                    field="nombreCompleto"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                  />
                </TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Deuda</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("creadoEn")}
                >
                  Registrado{" "}
                  <SortIcon
                    field="creadoEn"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                  />
                </TableHead>
                <TableHead className="w-20">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((cliente) => (
                <ClienteRowDesktop
                  key={cliente.id}
                  cliente={cliente}
                  canMutate={canMutate}
                  onDelete={handleDelete}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ─── ClienteForm Dialog ─── */}
      <Dialog
        open={formMode !== "closed"}
        onOpenChange={(open) => {
          if (!open) handleFormClose();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
            <DialogDescription>
              Registra un nuevo cliente en el sistema
            </DialogDescription>
          </DialogHeader>
          <DialogClose onClick={handleFormClose} />

          <ClienteForm
            mode="create"
            onSuccess={handleFormSuccess}
            onCancel={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      {/* ─── FAB: Nuevo Cliente ─── */}
      {canMutate && (
        <button
          onClick={() => setFormMode("create")}
          className="fixed bottom-20 right-4 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90 active:scale-95 lg:bottom-6 lg:right-6"
          aria-label="Nuevo Cliente"
        >
          <Users className="size-6" />
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary-foreground text-primary text-xs font-bold shadow-sm border border-primary">
            +
          </span>
        </button>
      )}
    </div>
  );
}

// ─── ClienteCard (mobile) ─────────────────────────

function ClienteCard({
  cliente,
  canMutate,
  onDelete,
}: {
  cliente: ClienteRow;
  canMutate: boolean;
  onDelete: (c: ClienteRow) => void;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              {cliente.idCliente}
            </span>
          </div>
          <p className="mt-1 truncate text-sm font-medium">
            {cliente.nombreCompleto}
          </p>
          {cliente.telefono && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {cliente.telefono}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Link
            href={`/clientes/${cliente.id}`}
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            title="Ver cliente"
          >
            <ExternalLink className="size-3.5" />
          </Link>
          {canMutate && (
            <button
              type="button"
              onClick={() => onDelete(cliente)}
              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              title="Desactivar cliente"
            >
              <PowerOff className="size-3.5" />
            </button>
          )}
          <DeudaBadge deuda={cliente.deuda} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t pt-3">
        {cliente.deuda > 0 ? (
          <span className="text-sm font-semibold text-destructive">
            {formatCOP(cliente.deuda)}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">$0</span>
        )}
      </div>
    </div>
  );
}

// ─── ClienteRowDesktop ────────────────────────────

function ClienteRowDesktop({
  cliente,
  canMutate,
  onDelete,
}: {
  cliente: ClienteRow;
  canMutate: boolean;
  onDelete: (c: ClienteRow) => void;
}) {
  return (
    <TableRow>
      <TableCell>
        <span className="font-mono text-xs text-muted-foreground">
          {cliente.idCliente}
        </span>
      </TableCell>
      <TableCell className="font-medium">
        <Link
          href={`/clientes/${cliente.id}`}
          className="hover:text-primary transition-colors"
        >
          {cliente.nombreCompleto}
        </Link>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {cliente.telefono ?? "—"}
      </TableCell>
      <TableCell>
        <DeudaBadge deuda={cliente.deuda} />
      </TableCell>
      <TableCell>
        {cliente.deuda > 0 ? (
          <span className="font-semibold text-destructive">
            {formatCOP(cliente.deuda)}
          </span>
        ) : (
          <span className="text-muted-foreground">$0</span>
        )}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {cliente.creadoEn.toLocaleDateString("es-CO", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Link
            href={`/clientes/${cliente.id}`}
            className="inline-flex h-6 items-center gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs font-medium text-foreground transition-all hover:bg-muted"
          >
            <ExternalLink className="size-3" />
            Ver
          </Link>
          {canMutate && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onDelete(cliente)}
            >
              Desactivar
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
