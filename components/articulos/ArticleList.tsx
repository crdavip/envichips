"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Package, Plus, RefreshCw, ShoppingCart } from "lucide-react";
import type { Articulo } from "@/lib/generated/prisma/client";
import {
  deleteArticuloAction,
  getArticulosAction,
  reactivateArticuloAction,
} from "@/app/dashboard/articulos/actions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { ArticleFilters } from "@/components/articulos/ArticleFilters";
import type { ArticleFiltersState } from "@/components/articulos/ArticleFilters";
import { ArticleCard } from "@/components/articulos/ArticleCard";
import { ArticleRow } from "@/components/articulos/ArticleRow";
import { ArticleForm } from "@/components/articulos/ArticleForm";
import { PurchaseModal } from "@/components/articulos/PurchaseModal";

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
  return sortOrder === "asc" ? <ArrowUp className="inline size-3" /> : <ArrowDown className="inline size-3" />;
}

// ─── Types ──────────────────────────────────────────

type FormMode = "closed" | "create" | "edit";

// ─── Component ──────────────────────────────────────

export function ArticleList() {
  // ── Data ──
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [filtros, setFiltros] = useState<ArticleFiltersState>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  // ── Sort ──
  const [sortBy, setSortBy] = useState<"nombre" | "precio" | "stockActual" | "creadoEn">("nombre");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (field: "nombre" | "precio" | "stockActual" | "creadoEn") => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // ── Form dialog ──
  const [formMode, setFormMode] = useState<FormMode>("closed");
  const [editingArticulo, setEditingArticulo] = useState<Articulo | null>(null);

  // ── Purchase modal ──
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  // ── Fetch articles ──
  const fetchArticulos = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const result = await getArticulosAction();
      if ("error" in result) {
        setError(result.error);
      } else {
        setArticulos(result.data);
      }
    } catch {
      setError("Error al cargar los artículos");
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchArticulos(), 0);
    return () => clearTimeout(timer);
  }, [fetchArticulos]);

  // ── Client-side filtering + sorting ──
  const filtered = [...articulos]
    .filter((a) => {
      if (filtros.categoria && a.categoria !== filtros.categoria) return false;
      if (filtros.presentacion && a.presentacion !== filtros.presentacion)
        return false;
      if (filtros.q) {
        const q = filtros.q.toLowerCase();
        if (!a.nombre.toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const dir = sortOrder === "asc" ? 1 : -1;
      switch (sortBy) {
        case "precio": return (a.precio - b.precio) * dir;
        case "stockActual": return (a.stockActual - b.stockActual) * dir;
        case "creadoEn": return (a.creadoEn.getTime() - b.creadoEn.getTime()) * dir;
        default: return a.nombre.localeCompare(b.nombre) * dir;
      }
    });

  // ── Handlers ──
  const handleCreate = () => {
    setEditingArticulo(null);
    setFormMode("create");
  };

  const handleEdit = (articulo: Articulo) => {
    setEditingArticulo(articulo);
    setFormMode("edit");
  };

  const handleFormClose = () => {
    setFormMode("closed");
    setEditingArticulo(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    fetchArticulos();
  };

  const handleToggleActivo = async (articulo: Articulo) => {
    const action = articulo.activo ? "desactivar" : "reactivar";
    if (
      !window.confirm(
        `¿Estás seguro de ${action === "desactivar" ? "desactivar" : "reactivar"} este artículo?`,
      )
    ) {
      return;
    }

    const result = articulo.activo
      ? await deleteArticuloAction(articulo.id)
      : await reactivateArticuloAction(articulo.id);

    if ("error" in result) {
      // Surface error silently for now
      return;
    }
    fetchArticulos();
  };

  const handlePurchaseSuccess = () => {
    setPurchaseOpen(false);
    fetchArticulos();
  };

  // ── Derive form dialog title ──
  const formTitle =
    formMode === "create"
      ? "Nuevo Artículo"
      : editingArticulo
        ? `Editar: ${editingArticulo.nombre}`
        : "Artículo";

  // ── Loading state ──
  if (loading) {
    return (
    <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>

        {/* Filters skeleton */}
        <div className="flex gap-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 flex-1" />
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error && articulos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={fetchArticulos}>
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
            <Package className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">Artículos</h1>
            <p className="text-sm text-muted-foreground">
              Catálogo de productos — {filtered.length} de {articulos.length} artículos
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button onClick={handleCreate} className="w-full sm:w-auto">
            <Plus className="size-4" />
            Nuevo Artículo
          </Button>
          <Button variant="outline" onClick={() => setPurchaseOpen(true)} className="w-full sm:w-auto">
            <ShoppingCart className="size-4" />
            + Compra
          </Button>
        </div>
      </div>

      {/* ─── Filters ─── */}
      <ArticleFilters filters={filtros} onChange={setFiltros} />

      {/* ─── Refetch button (on error with existing data) ─── */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <span>{error}</span>
          <Button
            variant="ghost"
            size="xs"
            onClick={fetchArticulos}
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
            <Package className="size-7" />
          </span>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {articulos.length === 0
                ? "No hay artículos registrados"
                : "Ningún artículo coincide con los filtros"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {articulos.length === 0
                ? "Creá tu primer artículo para empezar"
                : "Probá con otros filtros o palabras clave"}
            </p>
          </div>
          {articulos.length === 0 && (
            <Button onClick={handleCreate}>
              <Plus className="size-4" />
              Crear primer artículo
            </Button>
          )}
        </div>
      )}

      {/* ─── Grid view (mobile) ─── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:hidden">
        {filtered.map((articulo) => (
          <ArticleCard
            key={articulo.id}
            articulo={articulo}
            onEdit={handleEdit}
            onToggleActivo={handleToggleActivo}
          />
        ))}
      </div>

      {/* ─── Table view (desktop) ─── */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("nombre")}>
                Nombre <SortIcon field="nombre" sortBy={sortBy} sortOrder={sortOrder} />
              </TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Presentación</TableHead>
              <TableHead>Costo</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("precio")}>
                Precio <SortIcon field="precio" sortBy={sortBy} sortOrder={sortOrder} />
              </TableHead>
              <TableHead>Ganancia</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("stockActual")}>
                Stock <SortIcon field="stockActual" sortBy={sortBy} sortOrder={sortOrder} />
              </TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-20">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((articulo) => (
              <ArticleRow
                key={articulo.id}
                articulo={articulo}
                onEdit={handleEdit}
                onToggleActivo={handleToggleActivo}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ─── ArticleForm Dialog (always mounted, shown/hidden via open) ─── */}
      <Dialog
        open={formMode !== "closed"}
        onOpenChange={(open) => {
          if (!open) handleFormClose();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formTitle}</DialogTitle>
            <DialogDescription>
              {formMode === "create"
                ? "Registra un nuevo artículo en el catálogo"
                : "Actualiza los datos del artículo"}
            </DialogDescription>
          </DialogHeader>
          <DialogClose onClick={handleFormClose} />

          <ArticleForm
            mode={formMode === "create" ? "create" : "edit"}
            initialData={editingArticulo ?? undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      {/* ─── PurchaseModal (always mounted, shown/hidden via open) ─── */}
      <PurchaseModal
        articulos={articulos}
        open={purchaseOpen}
        onOpenChange={setPurchaseOpen}
        onSuccess={handlePurchaseSuccess}
      />
    </div>
  );
}
