import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bike } from "lucide-react";
import { getDomiciliarios, type DateRange } from "@/lib/services/informes";
import { DomiciliariosTable } from "@/components/informes/DomiciliariosTable";
import { DateRangeFilter } from "@/components/ganancias/DateRangeFilter";
import { Skeleton } from "@/components/ui/skeleton";

async function DomiciliariosContent({
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

  let customDesde: Date | undefined;
  let customHasta: Date | undefined;
  if (rango === "custom" && desde && hasta) {
    customDesde = new Date(`${desde}T00:00:00-05:00`);
    customHasta = new Date(`${hasta}T23:59:59-05:00`);
  }

  const rows = await getDomiciliarios(rango as DateRange, customDesde, customHasta);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/informes"
          className="flex size-10 items-center justify-center rounded-lg border bg-card text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
          aria-label="Volver a Informes"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Bike className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">Domiciliarios</h1>
          <p className="text-sm text-muted-foreground">
            Rendimiento por domiciliario
          </p>
        </div>
      </div>

      <DateRangeFilter />

      <DomiciliariosTable rows={rows} />
    </div>
  );
}

function DomiciliariosSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-1 h-4 w-64" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default async function DomiciliariosPage(props: {
  searchParams: Promise<{ rango?: string; desde?: string; hasta?: string }>;
}) {
  const sp = await props.searchParams;
  return (
    <Suspense fallback={<DomiciliariosSkeleton />}>
      <DomiciliariosContent
        rango={sp.rango ?? "today"}
        desde={sp.desde}
        hasta={sp.hasta}
      />
    </Suspense>
  );
}
