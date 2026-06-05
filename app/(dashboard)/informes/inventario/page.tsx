import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getInventario } from "@/lib/services/informes";
import { InventarioTable } from "@/components/informes/InventarioTable";
import { formatCOP } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, DollarSign, AlertTriangle, Ban } from "lucide-react";

async function InventarioContent() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { rows, resumen } = await getInventario();

  const summaryCards = [
    {
      title: "Total unidades",
      value: `${resumen.totalUnidades} und`,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Valor total inventario",
      value: formatCOP(resumen.valorTotal),
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Productos agotados",
      value: String(resumen.agotados.length),
      icon: Ban,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Package className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">Informe de Inventario</h1>
          <p className="text-sm text-muted-foreground">
            Stock actual, movimientos del período y valorización
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.title}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <span className={`flex size-8 items-center justify-center rounded-lg ${c.bg} ${c.color}`}>
                    <Icon className="size-4" />
                  </span>
                  {c.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tracking-tight">{c.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {resumen.agotados.length > 0 && (
        <Card className="border-red-200 ring-1 ring-red-100 dark:border-red-800 dark:ring-red-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-red-600">
              <AlertTriangle className="size-4" />
              Productos agotados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {resumen.agotados.map((nombre) => (
                <span
                  key={nombre}
                  className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
                >
                  {nombre}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <InventarioTable rows={rows} />
    </div>
  );
}

function InventarioSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-1 h-4 w-56" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function InventarioPage() {
  return (
    <Suspense fallback={<InventarioSkeleton />}>
      <InventarioContent />
    </Suspense>
  );
}
