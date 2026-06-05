import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { getGanancias, type DateRange } from "@/lib/services/informes";
import { GananciasCards } from "@/components/informes/GananciasCards";
import { DateRangeFilter } from "@/components/ganancias/DateRangeFilter";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

async function GananciasContent({
  rango,
  desde,
  hasta,
}: {
  rango: string;
  desde?: string;
  hasta?: string;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if ((session.user as { rol: string }).rol !== "SUPERADMIN") {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <p className="text-lg font-medium text-muted-foreground">No autorizado</p>
        <p className="text-sm text-muted-foreground">
          Solo los usuarios SUPERADMIN pueden ver este reporte.
        </p>
      </div>
    );
  }

  let customDesde: Date | undefined;
  let customHasta: Date | undefined;
  if (rango === "custom" && desde && hasta) {
    customDesde = new Date(`${desde}T00:00:00-05:00`);
    customHasta = new Date(`${hasta}T23:59:59-05:00`);
  }

  const resumen = await getGanancias(
    rango as DateRange,
    customDesde,
    customHasta,
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <TrendingUp className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">Ganancias</h1>
          <p className="text-sm text-muted-foreground">Ganancia bruta, costos, gastos operativos y ganancia neta</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <DateRangeFilter />
        <PeriodIndicator rango={rango} desde={desde} hasta={hasta} />
      </div>

      <GananciasCards resumen={resumen} />
    </div>
  );
}

function PeriodIndicator({
  rango,
  desde,
  hasta,
}: {
  rango: string;
  desde?: string;
  hasta?: string;
}) {
  const now = new Date();

  if (rango === "today") {
    return (
      <span className="text-sm text-muted-foreground">
        Hoy{" "}
        {now.toLocaleDateString("es-CO", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </span>
    );
  }

  if (rango === "week") {
    return <span className="text-sm text-muted-foreground">Esta semana</span>;
  }

  if (rango === "month") {
    return (
      <span className="text-sm text-muted-foreground">
        Este mes —{" "}
        {now.toLocaleDateString("es-CO", { month: "long", year: "numeric" })}
      </span>
    );
  }

  if (rango === "custom" && desde && hasta) {
    return (
      <span className="text-sm text-muted-foreground">
        {desde} → {hasta}
      </span>
    );
  }

  return null;
}

function GananciasSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-1 h-4 w-64" />
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
    </div>
  );
}

export default async function GananciasPage(props: {
  searchParams: Promise<{ rango?: string; desde?: string; hasta?: string }>;
}) {
  const sp = await props.searchParams;
  return (
    <Suspense fallback={<GananciasSkeleton />}>
      <GananciasContent
        rango={sp.rango ?? "today"}
        desde={sp.desde}
        hasta={sp.hasta}
      />
    </Suspense>
  );
}
