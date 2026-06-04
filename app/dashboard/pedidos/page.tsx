import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPedidosAction } from "./actions";
import { PedidoList } from "@/components/pedidos/PedidoList";

export const metadata: Metadata = {
  title: "Pedidos | Envichips",
  description: "Gestión de pedidos y domicilios",
};

export default async function PedidosPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const result = await getPedidosAction();

  const initialData = "data" in result ? result.data : undefined;
  const initialError = "error" in result ? result.error : null;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PedidoList initialData={initialData as unknown as { id: string; numeroPedido: string; fecha: string; estado: string; total: number; cliente: { nombreCompleto: string } | null; domiciliario: { nombre: string } | null }[]} initialError={initialError} />
    </div>
  );
}
