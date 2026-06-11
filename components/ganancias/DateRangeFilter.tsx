"use client";

import { useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const RANGES = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mes" },
  { value: "custom", label: "Personalizado" },
] as const;

export function DateRangeFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentRange = searchParams.get("rango") ?? "today";
  const customDesde = searchParams.get("desde") ?? "";
  const customHasta = searchParams.get("hasta") ?? "";

  const navigate = useCallback(
    (params: Record<string, string | null>) => {
      const sp = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(params)) {
        if (value === null) {
          sp.delete(key);
        } else {
          sp.set(key, value);
        }
      }
      router.push(`?${sp.toString()}`);
    },
    [searchParams, router],
  );

  const setRange = useCallback(
    (range: string) => {
      if (range === "custom") {
        navigate({ rango: range });
      } else {
        navigate({ rango: range, desde: null, hasta: null });
      }
    },
    [navigate],
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1">
        {RANGES.map((r) => (
          <Button
            key={r.value}
            variant={currentRange === r.value ? "default" : "outline"}
            size="sm"
            onClick={() => setRange(r.value)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      {currentRange === "custom" && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              Desde:
            </span>
            <Input
              type="date"
              value={customDesde}
              onChange={(e) => navigate({ desde: e.target.value || null })}
              className="h-8 w-full sm:w-36"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              Hasta:
            </span>
            <Input
              type="date"
              value={customHasta}
              onChange={(e) => navigate({ hasta: e.target.value || null })}
              className="h-8 w-full sm:w-36"
            />
          </div>
        </div>
      )}
    </div>
  );
}
