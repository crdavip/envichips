import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getConfig } from "@/lib/services/configuracion";
import { ConfigForm } from "@/components/configuracion/ConfigForm";
import { ChangePasswordForm } from "@/components/configuracion/ChangePasswordForm";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Settings } from "lucide-react";

export const metadata: Metadata = {
  title: "Configuración | Envichips",
  description: "Configuración del sistema",
};

// ─── Page content ─────────────────────────────────

async function ConfiguracionContent() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as { rol?: string }).rol;

  if (userRole === "SUPERADMIN") {
    const config = await getConfig();

    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Configuración del Negocio</CardTitle>
          </CardHeader>
          <CardContent>
            <ConfigForm initialData={config} />
          </CardContent>
        </Card>
        <ChangePasswordForm />
      </div>
    );
  }

  return <ChangePasswordForm />;
}

function ConfiguracionSkeleton() {
  return (
    <Card size="sm">
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32 ml-auto" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────

export default async function ConfiguracionPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Settings className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">Configuración</h1>
          <p className="text-sm text-muted-foreground">
            Administrá los datos globales del negocio
          </p>
        </div>
      </div>

      <Suspense fallback={<ConfiguracionSkeleton />}>
        <ConfiguracionContent />
      </Suspense>
    </div>
  );
}
