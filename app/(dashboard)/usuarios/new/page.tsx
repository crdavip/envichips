import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UsuarioForm } from "@/components/usuarios/UsuarioForm";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Nuevo Usuario | Envichips",
  description: "Crear un nuevo usuario en el sistema",
};

// ─── Page content ─────────────────────────────────

function NewUsuarioForm() {
  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold">Datos del Usuario</h2>
        <UsuarioForm mode="create" />
      </div>
    </div>
  );
}

function NewUsuarioSkeleton() {
  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-24 ml-auto" />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────

export default async function NewUsuarioPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as { rol?: string }).rol;
  if (userRole !== "SUPERADMIN") {
    redirect("/usuarios");
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-semibold">Nuevo Usuario</h1>
          <p className="text-sm text-muted-foreground">
            Creá un nuevo usuario para acceder al sistema
          </p>
        </div>
      </div>

      <Suspense fallback={<NewUsuarioSkeleton />}>
        <NewUsuarioForm />
      </Suspense>
    </div>
  );
}
