"use client";

import { ArrowUp, ArrowDown } from "lucide-react";
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectList,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────

interface SortField {
  key: string;
  label: string;
}

interface SortBarProps {
  fields: SortField[];
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
}

// ─── Component ────────────────────────────────────────

export function SortBar({ fields, sortBy, sortOrder, onSort }: SortBarProps) {
  return (
    <div className="flex items-center gap-2 lg:hidden">
      <SelectRoot value={sortBy} onValueChange={(v) => v && onSort(v)}>
        <SelectTrigger className="flex-1 min-w-0">
          <SelectValue placeholder="Ordenar por..." />
        </SelectTrigger>
        <SelectPopup>
          <SelectList>
            {fields.map((f) => (
              <SelectItem key={f.key} value={f.key}>
                {f.label}
              </SelectItem>
            ))}
          </SelectList>
        </SelectPopup>
      </SelectRoot>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onSort(sortBy)}
        aria-label={sortOrder === "asc" ? "Orden ascendente" : "Orden descendente"}
      >
        {sortOrder === "asc" ? (
          <ArrowUp className="size-4" />
        ) : (
          <ArrowDown className="size-4" />
        )}
      </Button>
    </div>
  );
}
