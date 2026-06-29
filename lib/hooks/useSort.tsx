"use client";

import { useState, useMemo, useCallback, type ReactNode } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

// ─── Types ────────────────────────────────────────────

export interface SortFieldConfig<T> {
  key: string;
  label: string;
  type: "string" | "number" | "date";
  nullsLast?: boolean;
  accessor?: (item: T) => string | number | Date | null;
}

export interface UseSortConfig<T> {
  data: T[];
  config: SortFieldConfig<T>[];
  defaultSortBy: string;
  defaultSortDir?: "asc" | "desc";
}

export interface UseSortReturn<T> {
  sorted: T[];
  sortBy: string;
  sortOrder: "asc" | "desc";
  handleSort: (field: string) => void;
  SortIcon: (field: string) => ReactNode;
  serverPayload: { sortBy: string; sortOrder: string };
}

// ─── Hook ─────────────────────────────────────────────

export function useSort<T>({
  data,
  config,
  defaultSortBy,
  defaultSortDir = "asc",
}: UseSortConfig<T>): UseSortReturn<T> {
  const [sortBy, setSortBy] = useState(defaultSortBy);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(defaultSortDir);

  // ── Toggle handler ──

  const handleSort = useCallback(
    (field: string) => {
      if (field === sortBy) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(field);
        setSortOrder("asc");
      }
    },
    [sortBy],
  );

  // ── Memoized sort ──

  const sorted = useMemo(() => {
    const activeConfig = config.find((c) => c.key === sortBy);
    if (!activeConfig) return [...data];

    const accessor =
      activeConfig.accessor ??
      ((item: T) => item[sortBy as keyof T] as string | number | Date | null);
    const dir = sortOrder === "asc" ? 1 : -1;

    return [...data].sort((a, b) => {
      const valA = accessor(a);
      const valB = accessor(b);

      // Nulls always last (or first if nullsLast is explicitly false)
      const nullsLast = activeConfig.nullsLast ?? true;
      if (valA == null && valB == null) return 0;
      if (valA == null) return nullsLast ? 1 : -1;
      if (valB == null) return nullsLast ? -1 : 1;

      switch (activeConfig.type) {
        case "string":
          return (valA as string).localeCompare(valB as string) * dir;
        case "number":
          return ((valA as number) - (valB as number)) * dir;
        case "date": {
          const timeA = new Date(valA as string | number | Date).getTime();
          const timeB = new Date(valB as string | number | Date).getTime();
          return (timeA - timeB) * dir;
        }
        default:
          return 0;
      }
    });
  }, [data, sortBy, sortOrder, config]);

  // ── SortIcon renderer ──

  const SortIcon = useCallback(
    (field: string): ReactNode => {
      if (sortBy !== field) return null;
      return sortOrder === "asc" ? (
        <ArrowUp className="inline size-3" />
      ) : (
        <ArrowDown className="inline size-3" />
      );
    },
    [sortBy, sortOrder],
  );

  return {
    sorted,
    sortBy,
    sortOrder,
    handleSort,
    SortIcon,
    serverPayload: { sortBy, sortOrder },
  };
}

// ─── Test plan ──────────────────────────────────────────
// 1. Default sort: data sorted asc by defaultSortBy field using the
//    specified type comparator.
// 2. Toggle direction: handleSort(field) on same field cycles
//    asc → desc → asc. Switching to a new field starts at asc.
// 3. Nulls-last: items with null/undefined values for the sorted
//    field always sort to the end regardless of sort direction.
// 4. Date string sorting: ISO date strings (e.g. "2024-06-01T00:00:00Z")
//    are correctly compared via new Date().getTime().
// 5. Accessor for computed field: ganancia = precio - costo uses
//    an explicit accessor instead of a direct key lookup.
