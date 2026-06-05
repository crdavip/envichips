"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Plus, RefreshCw, ExternalLink, Shield } from "lucide-react";
import { toggleUsuarioAction } from "@/app/(dashboard)/usuarios/actions";
import type { UsuarioListado } from "@/lib/services/usuarios";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";

// ─── Estado Badge ──────────────────────────────────

function EstadoBadge({ activo }: { activo: boolean }) {
  if (activo) {
    return <Badge variant="success">Activo</Badge>;
  }
  return <Badge variant="destructive">Inactivo</Badge>;
}

// ─── Rol Badge ─────────────────────────────────────

function RolBadge({ rol }: { rol: string }) {
  const variant =
    rol === "SUPERADMIN"
      ? "default"
      : rol === "ADMIN"
        ? "secondary"
        : "outline";
  return <Badge variant={variant}>{rol}</Badge>;
}

// ─── Format date ───────────────────────────────────

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── Component ─────────────────────────────────────

interface UsuariosTableProps {
  initialUsuarios: UsuarioListado[];
}

export function UsuariosTable({ initialUsuarios }: UsuariosTableProps) {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<UsuarioListado[]>(initialUsuarios);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  const fetchUsuarios = useCallback(async () => {
    // Reload page to get fresh data from server
    router.refresh();
  }, [router]);

  const handleToggle = async (id: string, nombre: string) => {
    const user = usuarios.find((u) => u.id === id);
    if (!user) return;

    const action = user.activo ? "desactivar" : "activar";
    if (
      !window.confirm(
        `¿Estás seguro de ${action} a "${nombre}"?`,
      )
    ) {
      return;
    }

    setFetching(true);
    setError(null);

    const result = await toggleUsuarioAction(id);
    if ("error" in result) {
      setError(result.error);
      setFetching(false);
      return;
    }

    router.refresh();
    setFetching(false);
  };

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">Usuarios</h1>
            <p className="text-sm text-muted-foreground">
              Gestión de usuarios del sistema — {usuarios.length} usuarios
            </p>
          </div>
        </div>
      </div>

      {/* ─── Error banner ─── */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <span>{error}</span>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => { setError(null); router.refresh(); }}
            disabled={fetching}
          >
            <RefreshCw className="size-3" />
            Reintentar
          </Button>
        </div>
      )}

      {/* ─── Empty state ─── */}
      {usuarios.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/5 text-primary/40">
            <Shield className="size-7" />
          </span>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              No hay usuarios registrados
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Creá tu primer usuario para empezar
            </p>
          </div>
          <Link href="/usuarios/new">
            <Button>
              <Plus className="size-4" />
              Crear primer usuario
            </Button>
          </Link>
        </div>
      )}

      {/* ─── Desktop table ─── */}
      {usuarios.length > 0 && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Último acceso</TableHead>
                <TableHead>Creado por</TableHead>
                <TableHead className="w-28">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium">
                    {usuario.nombre}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {usuario.email}
                  </TableCell>
                  <TableCell>
                    <RolBadge rol={usuario.rol} />
                  </TableCell>
                  <TableCell>
                    <EstadoBadge activo={usuario.activo} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {usuario.telefono ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(usuario.ultimoAcceso)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {usuario.creadoPor?.nombre ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Link href={`/usuarios/${usuario.id}`}>
                        <Button variant="ghost" size="xs">
                          <ExternalLink className="size-3" />
                          Editar
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() =>
                          handleToggle(usuario.id, usuario.nombre)
                        }
                        disabled={fetching}
                      >
                        {usuario.activo ? "Desactivar" : "Activar"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ─── FAB: Nuevo Usuario ─── */}
      <Link
        href="/usuarios/new"
        className="fixed bottom-20 right-4 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90 active:scale-95 lg:bottom-6 lg:right-6"
        aria-label="Nuevo Usuario"
      >
        <Shield className="size-6" />
        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary-foreground text-primary text-xs font-bold shadow-sm border border-primary">
          +
        </span>
      </Link>
    </div>
  );
}

// ─── Loading Skeleton ──────────────────────────────

export function UsuariosTableSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-8 w-36" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}
