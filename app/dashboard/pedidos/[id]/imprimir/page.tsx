import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ImprimirPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/pedidos/${id}`}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
          Volver al detalle
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="size-5" />
            Imprimir Pedido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Módulo de impresión disponible en Fase 3
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
