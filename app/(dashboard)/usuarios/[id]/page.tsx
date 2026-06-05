import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUsuario } from "@/lib/services/usuarios";
import { UsuarioForm } from "@/components/usuarios/UsuarioForm";
import { ToggleUsuarioButton } from "@/components/usuarios/ToggleUsuarioButton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// ─── Types ──────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>;
}

// ─── Generate Metadata ─────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const usuario = await getUsuario(id);

  if (!usuario) {
    return { title: "Usuario no encontrado | Envichips" };
  }

  return {
    title: `${usuario.nombre} | Envichips`,
  };
}

// ─── Page Content ─────────────────────────────────

async function EditUsuarioContent({ id }: { id: string }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as { rol?: string }).rol;
  if (userRole !== "SUPERADMIN") {
    redirect("/usuarios");
  }

  const usuario = await getUsuario(id);
  if (!usuario) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* ─── Edit form ─── */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold">Datos del Usuario</h2>
        <UsuarioForm mode="edit" initialData={usuario} />
      </div>

      {/* ─── Estado section ─── */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Estado del Usuario</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Estado actual:
            </span>
            <Badge variant={usuario.activo ? "success" : "destructive"}>
              {usuario.activo ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <ToggleUsuarioButton
            usuarioId={usuario.id}
            nombre={usuario.nombre}
            activo={usuario.activo}
          />
        </div>
      </div>
    </div>
  );
}

function EditUsuarioSkeleton() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
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
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-9 w-40" />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────

export default async function EditUsuarioPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Editar Usuario</h1>
          <p className="text-sm text-muted-foreground">
            Modificá los datos del usuario
          </p>
        </div>
        <Link href="/usuarios">
          <Button variant="outline">Volver</Button>
        </Link>
      </div>

      <Suspense fallback={<EditUsuarioSkeleton />}>
        <EditUsuarioContent id={id} />
      </Suspense>
    </div>
  );
}
