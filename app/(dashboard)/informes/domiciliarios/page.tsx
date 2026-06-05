import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Bike } from "lucide-react";
import { getDomiciliarios } from "@/lib/services/informes";
import { DomiciliariosTable } from "@/components/informes/DomiciliariosTable";
import { Skeleton } from "@/components/ui/skeleton";

async function DomiciliariosContent() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const rows = await getDomiciliarios();

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
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

export default function DomiciliariosPage() {
  return (
    <Suspense fallback={<DomiciliariosSkeleton />}>
      <DomiciliariosContent />
    </Suspense>
  );
}
