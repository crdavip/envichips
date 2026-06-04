import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getVentas } from "@/lib/services/informes";
import { VentasTable } from "@/components/informes/VentasTable";
import { formatCOP } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Award, DollarSign, BarChart3 } from "lucide-react";

async function VentasContent() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { productos, resumen } = await getVentas();

  const summaryCards = [
    {
      title: "Total vendido",
      value: formatCOP(resumen.totalVendido),
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Ganancia total",
      value: formatCOP(resumen.totalGanancia),
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Más vendido",
      value: resumen.masVendido ? `${resumen.masVendido.nombre} (${resumen.masVendido.unidades} und)` : "N/A",
      icon: BarChart3,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      title: "Más rentable",
      value: resumen.masRentable ? `${resumen.masRentable.nombre} (${formatCOP(resumen.masRentable.ganancia)})` : "N/A",
      icon: Award,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Informe de Ventas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Desglose de ventas por producto
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <p className="text-lg font-bold tracking-tight leading-tight">{c.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <VentasTable productos={productos} />
    </div>
  );
}

function VentasSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-1 h-4 w-48" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function VentasPage() {
  return (
    <Suspense fallback={<VentasSkeleton />}>
      <VentasContent />
    </Suspense>
  );
}
