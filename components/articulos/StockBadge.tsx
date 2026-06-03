import { Badge } from "@/components/ui/badge";

interface StockBadgeProps {
  stockActual: number;
  stockMinimo: number;
}

export function StockBadge({ stockActual, stockMinimo }: StockBadgeProps) {
  if (stockActual === 0) {
    return <Badge variant="destructive">Sin Stock</Badge>;
  }

  if (stockActual < stockMinimo) {
    return <Badge variant="warning">Stock Bajo</Badge>;
  }

  return <Badge variant="success">Stock OK</Badge>;
}
