"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectList,
  SelectItem,
} from "@/components/ui/select";
import type { Categoria, Presentacion } from "@/lib/generated/prisma/client";

export interface ArticleFiltersState {
  categoria?: Categoria;
  presentacion?: Presentacion;
  q?: string;
}

interface ArticleFiltersProps {
  filters: ArticleFiltersState;
  onChange: (filters: ArticleFiltersState) => void;
}

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

export function ArticleFilters({ filters, onChange }: ArticleFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.q ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      {/* Categoría filter */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Categoría
        </label>
        <SelectRoot
          value={filters.categoria ?? "__all__"}
          onValueChange={(value) =>
            onChange({
              ...filters,
              categoria: value === "__all__" ? undefined : (value as Categoria),
            })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Todas" />
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

      {/* Presentación filter */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Presentación
        </label>
        <SelectRoot
          value={filters.presentacion ?? "__all__"}
          onValueChange={(value) =>
            onChange({
              ...filters,
              presentacion:
                value === "__all__" ? undefined : (value as Presentacion),
            })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Todas" />
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

      {/* Search input */}
      <div className="flex flex-1 flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Buscar
        </label>
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
    </div>
  );
}
