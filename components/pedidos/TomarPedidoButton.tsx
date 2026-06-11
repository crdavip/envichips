"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { tomarPedidoAction } from "@/app/(dashboard)/pedidos/actions";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";

interface TomarPedidoButtonProps {
  pedidoId: string;
}

export function TomarPedidoButton({ pedidoId }: TomarPedidoButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await tomarPedidoAction(pedidoId);

      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess(true);
        // Brief delay to show checkmark before refresh
        setTimeout(() => {
          router.refresh();
        }, 800);
      }
    } catch {
      setError("Error al tomar el pedido");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Button size="sm" disabled variant="outline" className="gap-2">
        <Check className="size-4 text-emerald-500" />
        <span>Tomado</span>
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        onClick={handleClick}
        disabled={loading}
        className="gap-2"
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {loading ? "Tomando..." : "Tomar"}
      </Button>
      {error && (
        <p className="text-xs text-destructive text-right max-w-40">{error}</p>
      )}
    </div>
  );
}
