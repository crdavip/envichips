import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDomiciliarios } from "@/lib/services/informes";
import { DomiciliariosTable } from "@/components/informes/DomiciliariosTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

async function DomiciliariosContent() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const rows = await getDomiciliarios();

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Domiciliarios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rendimiento por domiciliario
        </p>
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
