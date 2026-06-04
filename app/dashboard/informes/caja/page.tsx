import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMovimientos, getResumenCaja } from "@/lib/services/movimientos";
import { CajaTable } from "@/components/informes/CajaTable";
import { CajaForm } from "@/components/informes/CajaForm";
import { formatCOP } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownCircle, ArrowUpCircle, DollarSign, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

async function CajaContent() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [{ movimientos }, resumen] = await Promise.all([
    getMovimientos({ limit: 1000 }),
    getResumenCaja(),
  ]);

  const summaryCards = [
    {
      title: "Total Ingresos",
      value: formatCOP(resumen.totalIngresos),
      icon: ArrowUpCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      rowClass: "text-emerald-600",
    },
    {
      title: "Total Gastos",
      value: formatCOP(resumen.totalGastos),
      icon: ArrowDownCircle,
      color: "text-red-600",
      bg: "bg-red-50",
      rowClass: "text-red-600",
    },
    {
      title: "Flujo Neto",
      value: formatCOP(resumen.flujoNeto),
      icon: DollarSign,
      color: resumen.flujoNeto >= 0 ? "text-emerald-600" : "text-red-600",
      bg: resumen.flujoNeto >= 0 ? "bg-emerald-50" : "bg-red-50",
      rowClass: resumen.flujoNeto >= 0 ? "text-emerald-600" : "text-red-600",
    },
    {
      title: "Saldo Actual",
      value: formatCOP(resumen.saldoActual),
      icon: Wallet,
      color: "text-blue-600",
      bg: "bg-blue-50",
      rowClass: "",
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Caja</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Movimientos y saldo de caja
          </p>
        </div>
        <CajaForm />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.title}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <span className={cn("flex size-8 items-center justify-center rounded-lg", c.bg, c.color)}>
                    <Icon className="size-4" />
                  </span>
                  {c.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={cn("text-2xl font-bold tracking-tight", c.rowClass)}>
                  {c.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <CajaTable movimientos={movimientos} />
    </div>
  );
}

function CajaSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-1 h-4 w-56" />
        </div>
        <Skeleton className="h-8 w-40" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function CajaPage() {
  return (
    <Suspense fallback={<CajaSkeleton />}>
      <CajaContent />
    </Suspense>
  );
}
