"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toggleUsuarioAction } from "@/app/(dashboard)/usuarios/actions";
import { Button } from "@/components/ui/button";

interface ToggleUsuarioButtonProps {
  usuarioId: string;
  nombre: string;
  activo: boolean;
}

export function ToggleUsuarioButton({
  usuarioId,
  nombre,
  activo,
}: ToggleUsuarioButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    const action = activo ? "desactivar" : "activar";
    if (
      !window.confirm(
        `¿Estás seguro de ${action} a "${nombre}"?`,
      )
    ) {
      return;
    }

    setLoading(true);
    const result = await toggleUsuarioAction(usuarioId);
    if ("error" in result) {
      alert(result.error);
    }
    router.refresh();
    setLoading(false);
  };

  return (
    <Button
      variant={activo ? "destructive" : "default"}
      onClick={handleToggle}
      disabled={loading}
    >
      {activo ? "Desactivar Usuario" : "Activar Usuario"}
    </Button>
  );
}
