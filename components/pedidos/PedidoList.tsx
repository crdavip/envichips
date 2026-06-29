"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ShoppingCart, RefreshCw, Search, Package } from "lucide-react";
import { useSort } from "@/lib/hooks/useSort";
import type { SortFieldConfig } from "@/lib/hooks/useSort";
import { SortBar } from "@/components/ui/sort-controls";
import { roleGte } from "@/lib/auth/authorize";
import {
  getPedidosAction,
} from "@/app/(dashboard)/pedidos/actions";
import type { PedidoFilters } from "@/lib/services/pedidos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectList,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { PedidoStatusBadge } from "@/components/pedidos/PedidoStatusBadge";
import { TomarPedidoButton } from "@/components/pedidos/TomarPedidoButton";
import { formatCOP } from "@/lib/format";

// ─── Types ──────────────────────────────────────────

interface PedidoListItem {
  id: string;
  numeroPedido: string;
  fecha: string;
  estado: string;
  total: number;
  cliente: { nombreCompleto: string } | null;
  domiciliario: { nombre: string } | null;
}

interface DomiciliarioOption {
  id: string;
  nombre: string;
}

// ─── Helpers ────────────────────────────────────────

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── Props ──────────────────────────────────────────

interface PedidoListProps {
  initialData?: PedidoListItem[];
  initialError?: string | null;
  userRole?: string;
}

// ─── Component ──────────────────────────────────────

export function PedidoList({ initialData, initialError, userRole }: PedidoListProps) {
  // only allow create/mutation for ADMIN+
  const canMutate = roleGte({ rol: userRole }, "ADMIN");
  // ── Data ──
  const [pedidos, setPedidos] = useState<PedidoListItem[]>(initialData ?? []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [fetching, setFetching] = useState(false);

  // ── Filters ──
  const [estadoFilter, setEstadoFilter] = useState<string>("");
  const [fechaDesde, setFechaDesde] = useState<string>("");
  const [fechaHasta, setFechaHasta] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [domiciliarioId, setDomiciliarioId] = useState<string>("");

  // ── Derived: domiciliarios from fetched data (admin only) ──
  const domiciliarios = useMemo<DomiciliarioOption[]>(() => {
    const map = new Map<string, string>();
    for (const p of pedidos) {
      if (p.domiciliario) {
        map.set(p.domiciliario.nombre, p.domiciliario.nombre);
      }
    }
    return Array.from(map.entries()).map(([nombre]) => ({
      id: nombre,
      nombre,
    }));
  }, [pedidos]);

  // ── Fetch pedidos ──
  const fetchPedidos = useCallback(async (filters?: {
    estado?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    search?: string;
    domiciliarioId?: string;
  }) => {
    setFetching(true);
    setError(null);
    try {
      const result = await getPedidosAction(filters as PedidoFilters);
      if ("error" in result) {
        setError(result.error);
      } else {
        setPedidos(result.data as unknown as PedidoListItem[]);
      }
    } catch {
      setError("Error al cargar los pedidos");
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) {
      const timer = setTimeout(() => fetchPedidos(), 0);
      return () => clearTimeout(timer);
    }
  }, [fetchPedidos, initialData]);

  // ── Filter handlers ──
  const buildFilters = useCallback(() => {
    const filters: Record<string, string> = {};
    if (estadoFilter) filters.estado = estadoFilter;
    if (fechaDesde) filters.fechaDesde = fechaDesde;
    if (fechaHasta) filters.fechaHasta = fechaHasta;
    if (searchQuery) filters.search = searchQuery;
    if (domiciliarioId) filters.domiciliarioNombre = domiciliarioId;
    return filters;
  }, [estadoFilter, fechaDesde, fechaHasta, searchQuery, domiciliarioId]);

  const handleFilter = () => {
    fetchPedidos(buildFilters());
  };

  const handleClearFilters = () => {
    setEstadoFilter("");
    setFechaDesde("");
    setFechaHasta("");
    setSearchQuery("");
    setDomiciliarioId("");
    fetchPedidos();
  };

  // ── Sort config + client-side sorting ──
  const sortFields: SortFieldConfig<PedidoListItem>[] = [
    { key: "numeroPedido", label: "Pedido", type: "string" },
    { key: "cliente", label: "Cliente", type: "string", accessor: (p: PedidoListItem) => p.cliente?.nombreCompleto ?? "" },
    { key: "total", label: "Total", type: "number" },
    { key: "estado", label: "Estado", type: "string" },
    { key: "domiciliario", label: "Domiciliario", type: "string", accessor: (p: PedidoListItem) => p.domiciliario?.nombre ?? "", nullsLast: true },
    { key: "fecha", label: "Fecha", type: "date" },
  ];

  const { sorted, sortBy, sortOrder, handleSort, SortIcon } = useSort({
    data: pedidos,
    config: sortFields,
    defaultSortBy: "fecha",
    defaultSortDir: "desc",
  });

  // ── Loading state ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error && pedidos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={() => fetchPedidos()}>
          <RefreshCw className="size-4" />
          Reintentar
        </Button>
      </div>
    );
  }

  // ── DOMICILIARIO: split pedidos into disponibles / propios ──
  const disponibles = useMemo(
    () => sorted.filter((p) => p.estado === "PENDIENTE" && !p.domiciliario),
    [sorted],
  );
  const misPedidos = useMemo(
    () => sorted.filter((p) => p.domiciliario),
    [sorted],
  );

  const [domTab, setDomTab] = useState<"disponibles" | "mios">("disponibles");

  if (userRole === "DOMICILIARIO") {
    return (
      <div className="space-y-6">
        {/* ─── Header ─── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShoppingCart className="size-5" />
            </span>
            <div>
              <h1 className="text-xl font-semibold">Pedidos</h1>
              <p className="text-sm text-muted-foreground">
                {sorted.length} pedido{sorted.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Tabs ─── */}
        <div className="flex gap-2 border-b pb-2">
          <button
            type="button"
            onClick={() => setDomTab("disponibles")}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
              domTab === "disponibles"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Disponibles ({disponibles.length})
          </button>
          <button
            type="button"
            onClick={() => setDomTab("mios")}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
              domTab === "mios"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mis pedidos ({misPedidos.length})
          </button>
        </div>

        {/* ─── Error ─── */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <span>{error}</span>
            <Button variant="ghost" size="xs" onClick={() => fetchPedidos()} disabled={fetching}>
              <RefreshCw className="size-3" />
              Reintentar
            </Button>
          </div>
        )}

        {/* ─── Disponibles Tab ─── */}
        {domTab === "disponibles" && (
          <>
            {disponibles.length === 0 && !fetching ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/5 text-primary/40">
                  <Package className="size-7" />
                </span>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">No hay pedidos disponibles</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Todos los pedidos Pendientes ya fueron asignados
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* SortBar (mobile) */}
                <SortBar fields={sortFields} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />

                {/* Card view (mobile) */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
                  {disponibles.map((pedido) => (
                    <Link
                      key={pedido.id}
                      href={`/pedidos/${pedido.id}`}
                      className="group/card rounded-xl border bg-card p-4 text-sm text-card-foreground shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-mono text-xs font-semibold text-muted-foreground">
                            {pedido.numeroPedido}
                          </p>
                          <p className="mt-1 font-medium leading-tight">
                            {pedido.cliente?.nombreCompleto ?? "Venta rápida"}
                          </p>
                        </div>
                        <PedidoStatusBadge estado={pedido.estado} />
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t pt-3">
                        <div className="space-y-0.5">
                          <p className="text-lg font-bold tracking-tight">{formatCOP(pedido.total)}</p>
                        </div>
                        <TomarPedidoButton pedidoId={pedido.id} />
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Table view (desktop) */}
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort("numeroPedido")}>
                          Pedido {SortIcon("numeroPedido")}
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort("cliente")}>
                          Cliente {SortIcon("cliente")}
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort("total")}>
                          Total {SortIcon("total")}
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort("estado")}>
                          Estado {SortIcon("estado")}
                        </TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {disponibles.map((pedido) => (
                        <TableRow key={pedido.id}>
                          <TableCell>
                            <Link href={`/pedidos/${pedido.id}`} className="font-mono text-xs font-semibold text-muted-foreground hover:text-foreground">
                              {pedido.numeroPedido}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link href={`/pedidos/${pedido.id}`} className="font-medium hover:underline">
                              {pedido.cliente?.nombreCompleto ?? "Venta rápida"}
                            </Link>
                          </TableCell>
                          <TableCell className="font-medium">{formatCOP(pedido.total)}</TableCell>
                          <TableCell>
                            <Link href={`/pedidos/${pedido.id}`}>
                              <PedidoStatusBadge estado={pedido.estado} />
                            </Link>
                          </TableCell>
                          <TableCell className="text-right">
                            <TomarPedidoButton pedidoId={pedido.id} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </>
        )}

        {/* ─── Mis Pedidos Tab ─── */}
        {domTab === "mios" && (
          <>
            {misPedidos.length === 0 && !fetching ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/5 text-primary/40">
                  <ShoppingCart className="size-7" />
                </span>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">No tienes pedidos asignados</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Tomá un pedido disponible para comenzar
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* SortBar (mobile) */}
                <SortBar fields={sortFields} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />

                {/* Card view (mobile) */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
                  {misPedidos.map((pedido) => (
                    <Link
                      key={pedido.id}
                      href={`/pedidos/${pedido.id}`}
                      className="group/card rounded-xl border bg-card p-4 text-sm text-card-foreground shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-mono text-xs font-semibold text-muted-foreground">
                            {pedido.numeroPedido}
                          </p>
                          <p className="mt-1 font-medium leading-tight">
                            {pedido.cliente?.nombreCompleto ?? "Venta rápida"}
                          </p>
                        </div>
                        <PedidoStatusBadge estado={pedido.estado} />
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t pt-3">
                        <div className="space-y-0.5">
                          <p className="text-lg font-bold tracking-tight">{formatCOP(pedido.total)}</p>
                          {pedido.domiciliario && (
                            <p className="text-xs text-muted-foreground">{pedido.domiciliario.nombre}</p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{formatDate(pedido.fecha)}</p>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Table view (desktop) */}
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort("numeroPedido")}>
                          Pedido {SortIcon("numeroPedido")}
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort("cliente")}>
                          Cliente {SortIcon("cliente")}
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort("total")}>
                          Total {SortIcon("total")}
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort("estado")}>
                          Estado {SortIcon("estado")}
                        </TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort("fecha")}>
                          Fecha {SortIcon("fecha")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {misPedidos.map((pedido) => (
                        <TableRow key={pedido.id} className="cursor-pointer">
                          <TableCell>
                            <Link href={`/pedidos/${pedido.id}`} className="font-mono text-xs font-semibold text-muted-foreground hover:text-foreground">
                              {pedido.numeroPedido}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link href={`/pedidos/${pedido.id}`} className="font-medium hover:underline">
                              {pedido.cliente?.nombreCompleto ?? "Venta rápida"}
                            </Link>
                          </TableCell>
                          <TableCell className="font-medium">{formatCOP(pedido.total)}</TableCell>
                          <TableCell>
                            <Link href={`/pedidos/${pedido.id}`}>
                              <PedidoStatusBadge estado={pedido.estado} />
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(pedido.fecha)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShoppingCart className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">Pedidos</h1>
            <p className="text-sm text-muted-foreground">
              {sorted.length} pedido{sorted.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-end sm:flex-wrap">
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Estado
          </label>
          <SelectRoot
            value={estadoFilter || undefined}
            onValueChange={(v) => setEstadoFilter(v ?? "")}
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectPopup>
              <SelectList>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="EN_CAMINO">En Camino</SelectItem>
                <SelectItem value="ENTREGADO">Entregado</SelectItem>
                <SelectItem value="CANCELADO">Cancelado</SelectItem>
              </SelectList>
            </SelectPopup>
          </SelectRoot>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Desde
          </label>
          <Input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Hasta
          </label>
          <Input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Cliente / Pedido
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 sm:w-48"
            />
          </div>
        </div>

        {domiciliarios.length > 0 && (
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Domiciliario
            </label>
            <SelectRoot
              value={domiciliarioId || undefined}
              onValueChange={(v) => setDomiciliarioId(v ?? "")}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectPopup>
                <SelectList>
                  <SelectItem value="">Todos</SelectItem>
                  {domiciliarios.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nombre}
                    </SelectItem>
                  ))}
                </SelectList>
              </SelectPopup>
            </SelectRoot>
          </div>
        )}

        <div className="flex items-end gap-2">
          <Button size="sm" onClick={handleFilter}>
            Filtrar
          </Button>
          <Button size="sm" variant="ghost" onClick={handleClearFilters}>
            Limpiar
          </Button>
        </div>
      </div>

      {/* ─── Refetch error banner ─── */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <span>{error}</span>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => fetchPedidos(buildFilters())}
            disabled={fetching}
          >
            <RefreshCw className="size-3" />
            Reintentar
          </Button>
        </div>
      )}

      {/* ─── Empty state ─── */}
      {sorted.length === 0 && !fetching && (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/5 text-primary/40">
            <ShoppingCart className="size-7" />
          </span>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              No se encontraron pedidos
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Probá con otros filtros o creá un nuevo pedido
            </p>
          </div>
        </div>
      )}

      {/* ─── SortBar (mobile) ─── */}
      <SortBar fields={sortFields} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />

      {/* ─── Card view (mobile) ─── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
        {sorted.map((pedido) => (
          <Link
            key={pedido.id}
            href={`/pedidos/${pedido.id}`}
            className="group/card rounded-xl border bg-card p-4 text-sm text-card-foreground shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-xs font-semibold text-muted-foreground">
                  {pedido.numeroPedido}
                </p>
                <p className="mt-1 font-medium leading-tight">
                  {pedido.cliente?.nombreCompleto ?? "Venta rápida"}
                </p>
              </div>
              <PedidoStatusBadge estado={pedido.estado} />
            </div>

            <div className="mt-3 flex items-center justify-between border-t pt-3">
              <div className="space-y-0.5">
                <p className="text-lg font-bold tracking-tight">
                  {formatCOP(pedido.total)}
                </p>
                {pedido.domiciliario && (
                  <p className="text-xs text-muted-foreground">
                    {pedido.domiciliario.nombre}
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDate(pedido.fecha)}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* ─── Table view (desktop) ─── */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("numeroPedido")}>
                Pedido {SortIcon("numeroPedido")}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("cliente")}>
                Cliente {SortIcon("cliente")}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("total")}>
                Total {SortIcon("total")}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("estado")}>
                Estado {SortIcon("estado")}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("domiciliario")}>
                Domiciliario {SortIcon("domiciliario")}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("fecha")}>
                Fecha {SortIcon("fecha")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((pedido) => (
              <TableRow key={pedido.id} className="cursor-pointer">
                <TableCell>
                  <Link
                    href={`/pedidos/${pedido.id}`}
                    className="font-mono text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    {pedido.numeroPedido}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/pedidos/${pedido.id}`}
                    className="font-medium hover:underline"
                  >
                    {pedido.cliente?.nombreCompleto ?? "Venta rápida"}
                  </Link>
                </TableCell>
                <TableCell className="font-medium">
                  {formatCOP(pedido.total)}
                </TableCell>
                <TableCell>
                  <Link href={`/pedidos/${pedido.id}`}>
                    <PedidoStatusBadge estado={pedido.estado} />
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {pedido.domiciliario?.nombre ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(pedido.fecha)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ─── FAB: Nuevo Pedido ─── */}
      {canMutate && (
        <Link
          href="/pedidos/create"
          className="fixed bottom-20 right-4 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90 active:scale-95 lg:bottom-6 lg:right-6"
          aria-label="Nuevo Pedido"
        >
          <ShoppingCart className="size-6" />
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary-foreground text-primary text-xs font-bold shadow-sm border border-primary">
            +
          </span>
        </Link>
      )}
    </div>
  );
}
