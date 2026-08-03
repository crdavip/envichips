"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Filter, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import type { Categoria, Presentacion } from "@/lib/generated/prisma/client";
import type { Articulo } from "@/lib/generated/prisma/client";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────

export type StockStatusFilter = "sin-stock" | "bajo" | "ok";

export interface ArticleFiltersState {
  categoria?: Categoria;
  presentacion?: Presentacion;
  q?: string;
  activo?: boolean;
  stockStatus?: StockStatusFilter;
  precioMin?: number;
  precioMax?: number;
}

interface ArticleFiltersProps {
  filters: ArticleFiltersState;
  onChange: (filters: ArticleFiltersState) => void;
  articulos: Articulo[];
}

// ─── Constants ──────────────────────────────────────

const CATEGORIAS: Categoria[] = [
  "PAPA",
  "PLATANO",
  "MADURO",
  "CHICHARRON",
  "ROSQUITA",
  "ROSCA",
  "DETODITO",
  "ARITOS",
  "OTRO",
];

const PRESENTACIONES: Presentacion[] = [
  "G50",
  "G65",
  "G250",
  "G500",
  "OTRO",
];

// ─── Helpers ────────────────────────────────────────

export function getStockStatus(articulo: Articulo): StockStatusFilter {
  if (articulo.stockActual === 0) return "sin-stock";
  if (articulo.stockActual < articulo.stockMinimo) return "bajo";
  return "ok";
}

function getActiveFilterCount(filters: ArticleFiltersState): number {
  let count = 0;
  if (filters.presentacion) count++;
  if (filters.activo !== undefined) count++;
  if (filters.stockStatus) count++;
  if (filters.precioMin !== undefined) count++;
  if (filters.precioMax !== undefined) count++;
  return count;
}

// ─── Chip Component ─────────────────────────────────

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex size-3.5 items-center justify-center rounded-full transition-colors hover:bg-primary/20"
        aria-label={`Quitar filtro: ${label}`}
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

// ─── Main Component ─────────────────────────────────

export function ArticleFilters({ filters, onChange, articulos }: ArticleFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.q ?? "");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Local state for drawer fields (committed on "Aplicar")
  const [localPresentacion, setLocalPresentacion] = useState<Presentacion | undefined>(
    filters.presentacion,
  );
  const [localActivo, setLocalActivo] = useState<string>(
    filters.activo === undefined ? "todos" : filters.activo ? "activo" : "inactivo",
  );
  const [localStockStatus, setLocalStockStatus] = useState<StockStatusFilter | undefined>(
    filters.stockStatus,
  );
  const [localPrecioMin, setLocalPrecioMin] = useState(filters.precioMin ?? "");
  const [localPrecioMax, setLocalPrecioMax] = useState(filters.precioMax ?? "");

  // Sync local state when filters change externally
  useEffect(() => {
    setLocalPresentacion(filters.presentacion);
    setLocalActivo(filters.activo === undefined ? "todos" : filters.activo ? "activo" : "inactivo");
    setLocalStockStatus(filters.stockStatus);
    setLocalPrecioMin(filters.precioMin ?? "");
    setLocalPrecioMax(filters.precioMax ?? "");
  }, [filters]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        onChange({ ...filters, q: value || undefined });
      }, 300);
    },
    [filters, onChange],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleApplyFilters = () => {
    onChange({
      ...filters,
      presentacion: localPresentacion,
      activo: localActivo === "todos" ? undefined : localActivo === "activo",
      stockStatus: localStockStatus,
      precioMin: localPrecioMin === "" ? undefined : Number(localPrecioMin),
      precioMax: localPrecioMax === "" ? undefined : Number(localPrecioMax),
    });
    setDrawerOpen(false);
  };

  const handleClearAll = () => {
    onChange({
      categoria: filters.categoria,
      q: filters.q,
    });
    setLocalPresentacion(undefined);
    setLocalActivo("todos");
    setLocalStockStatus(undefined);
    setLocalPrecioMin("");
    setLocalPrecioMax("");
  };

  const removeFilter = (key: keyof ArticleFiltersState) => {
    const next = { ...filters };
    delete next[key];
    onChange(next);
  };

  const activeCount = getActiveFilterCount(filters);

  // Build chip labels
  const chips: { key: keyof ArticleFiltersState; label: string }[] = [];
  if (filters.categoria) chips.push({ key: "categoria", label: filters.categoria });
  if (filters.presentacion) chips.push({ key: "presentacion", label: filters.presentacion });
  if (filters.activo !== undefined)
    chips.push({ key: "activo", label: filters.activo ? "Activo" : "Inactivo" });
  if (filters.stockStatus) {
    const labels: Record<StockStatusFilter, string> = {
      "sin-stock": "Sin Stock",
      bajo: "Stock Bajo",
      ok: "Stock OK",
    };
    chips.push({ key: "stockStatus", label: labels[filters.stockStatus] });
  }
  if (filters.precioMin !== undefined || filters.precioMax !== undefined) {
    const min = filters.precioMin ?? 0;
    const max = filters.precioMax ?? "∞";
    chips.push({
      key: "precioMin",
      label: `Precio: $${min} – $${max === "∞" ? "∞" : max}`,
    });
  }

  return (
    <div className="space-y-3">
      {/* ─── Top bar: search + categoría (always visible) + filtros button ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {/* Search */}
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Buscar</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar artículo..."
              value={searchValue}
              onChange={handleSearchChange}
              className="pl-8"
            />
          </div>
        </div>

        {/* Categoría (always visible per user choice) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Categoría</label>
          <SelectRoot
            value={filters.categoria ?? "__all__"}
            onValueChange={(value) =>
              onChange({
                ...filters,
                categoria: value === "__all__" ? undefined : (value as Categoria),
              })
            }
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Todas">
                {filters.categoria ?? "Todas"}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectList>
                <SelectItem value="__all__">Todas</SelectItem>
                {CATEGORIAS.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectList>
            </SelectPopup>
          </SelectRoot>
        </div>

        {/* Filtros button */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">&nbsp;</label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDrawerOpen(true)}
            className="relative w-full sm:w-auto"
          >
            <Filter className="mr-1.5 size-4" />
            Filtros
            {activeCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
              >
                {activeCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* ─── Active filter chips ─── */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <FilterChip
              key={chip.key}
              label={chip.label}
              onRemove={() => removeFilter(chip.key)}
            />
          ))}
          <Button
            variant="ghost"
            size="xs"
            onClick={handleClearAll}
            className="text-xs text-muted-foreground"
          >
            Limpiar todo
          </Button>
        </div>
      )}

      {/* ─── Filter Drawer (Dialog-based bottom sheet) ─── */}
      <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogContent
          className={cn(
            // Mobile: bottom sheet
            "self-end sm:self-center",
            "max-h-[85vh] overflow-y-auto sm:max-w-lg",
          )}
        >
          <DialogHeader>
            <DialogTitle>Filtros avanzados</DialogTitle>
            <DialogClose onClick={() => setDrawerOpen(false)} />
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Presentación */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Presentación</label>
              <SelectRoot
                value={localPresentacion ?? "__all__"}
                onValueChange={(value) =>
                  setLocalPresentacion(
                    value === "__all__" ? undefined : (value as Presentacion),
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas">
                    {localPresentacion ?? "Todas"}
                  </SelectValue>
                </SelectTrigger>
                <SelectPopup>
                  <SelectList>
                    <SelectItem value="__all__">Todas</SelectItem>
                    {PRESENTACIONES.map((pres) => (
                      <SelectItem key={pres} value={pres}>
                        {pres}
                      </SelectItem>
                    ))}
                  </SelectList>
                </SelectPopup>
              </SelectRoot>
            </div>

            {/* Activo / Inactivo */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Estado</label>
              <SelectRoot
                value={localActivo}
                onValueChange={(value) => setLocalActivo(value ?? "todos")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  <SelectList>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectList>
                </SelectPopup>
              </SelectRoot>
            </div>

            {/* Stock Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Stock</label>
              <SelectRoot
                value={localStockStatus ?? "__all__"}
                onValueChange={(value) =>
                  setLocalStockStatus(
                    value === "__all__" ? undefined : (value as StockStatusFilter),
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos">
                    {localStockStatus
                      ? { "sin-stock": "Sin Stock", bajo: "Stock Bajo", ok: "Stock OK" }[
                          localStockStatus
                        ]
                      : "Todos"}
                  </SelectValue>
                </SelectTrigger>
                <SelectPopup>
                  <SelectList>
                    <SelectItem value="__all__">Todos</SelectItem>
                    <SelectItem value="sin-stock">Sin Stock</SelectItem>
                    <SelectItem value="bajo">Stock Bajo</SelectItem>
                    <SelectItem value="ok">Stock OK</SelectItem>
                  </SelectList>
                </SelectPopup>
              </SelectRoot>
            </div>

            {/* Precio range */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Rango de precio</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  placeholder="Mín"
                  value={localPrecioMin}
                  onChange={(e) => setLocalPrecioMin(e.target.value)}
                  className="w-full"
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="Máx"
                  value={localPrecioMax}
                  onChange={(e) => setLocalPrecioMax(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={handleClearAll}>
              Limpiar todo
            </Button>
            <Button onClick={handleApplyFilters}>Aplicar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
