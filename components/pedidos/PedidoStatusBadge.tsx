import { Badge } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

const statusConfig: Record<
  string,
  {
    variant: VariantProps<typeof Badge>["variant"];
    label: string;
  }
> = {
  PENDIENTE: { variant: "secondary", label: "Pendiente" },
  EN_CAMINO: { variant: "warning", label: "En Camino" },
  ENTREGADO: { variant: "success", label: "Entregado" },
  CANCELADO: { variant: "destructive", label: "Cancelado" },
};

interface PedidoStatusBadgeProps {
  estado: string;
}

export function PedidoStatusBadge({ estado }: PedidoStatusBadgeProps) {
  const config = statusConfig[estado] ?? { variant: "outline", label: estado };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
