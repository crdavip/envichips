"use client";

import type { ResumenGanancias } from "@/lib/services/informes";
import { formatCOP } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, Package, Receipt, PiggyBank } from "lucide-react";

interface GananciasCardsProps {
  resumen: ResumenGanancias;
}

const cards = [
  {
    key: "gananciaBruta" as const,
    title: "Ganancia Bruta",
    icon: TrendingUp,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    key: "costoVentas" as const,
    title: "Costo de Ventas",
    icon: Package,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    key: "gastosOperativos" as const,
    title: "Gastos Operativos",
    icon: Receipt,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    key: "gananciaNeta" as const,
    title: "Ganancia Neta",
    icon: PiggyBank,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
];

export function GananciasCards({ resumen }: GananciasCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        const value = resumen[c.key];
        const isNeta = c.key === "gananciaNeta";
        const netaColor = isNeta
          ? value >= 0
            ? "text-emerald-600"
            : "text-red-600"
          : c.color;
        const netaBg = isNeta
          ? value >= 0
            ? "bg-emerald-50"
            : "bg-red-50"
          : c.bg;

        return (
          <Card key={c.key}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className={cn("flex size-8 items-center justify-center rounded-lg", netaBg, netaColor)}>
                  <Icon className="size-4" />
                </span>
                {c.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={cn("text-2xl font-bold tracking-tight", netaColor)}>
                {formatCOP(value)}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
