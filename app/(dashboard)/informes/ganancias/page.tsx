import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getGanancias } from "@/lib/services/informes";
import { GananciasCards } from "@/components/informes/GananciasCards";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

async function GananciasContent() {
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

  const resumen = await getGanancias();

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ganancias</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ganancia bruta, costos, gastos operativos y ganancia neta
        </p>
      </div>
      <GananciasCards resumen={resumen} />
    </div>
  );
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

export default function GananciasPage() {
  return (
    <Suspense fallback={<GananciasSkeleton />}>
      <GananciasContent />
    </Suspense>
  );
}
