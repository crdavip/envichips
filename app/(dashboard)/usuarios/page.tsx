import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUsuarios } from "@/lib/services/usuarios";
import {
  UsuariosTable,
  UsuariosTableSkeleton,
} from "@/components/usuarios/UsuariosTable";

export const metadata: Metadata = {
  title: "Usuarios | Envichips",
  description: "Gestión de usuarios del sistema",
};

// ─── Page content ─────────────────────────────────

async function UsuariosContent() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as { rol?: string }).rol;
  if (userRole !== "SUPERADMIN") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-sm text-destructive">
          No autorizado — solo SuperAdmin puede acceder a esta sección
        </p>
      </div>
    );
  }

  const usuarios = await getUsuarios();

  return <UsuariosTable initialUsuarios={usuarios} />;
}

// ─── Page ─────────────────────────────────────────

export default async function UsuariosPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Suspense fallback={<UsuariosTableSkeleton />}>
        <UsuariosContent />
      </Suspense>
    </div>
  );
}
