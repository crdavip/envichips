import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPedidoByIdAction } from "@/app/dashboard/pedidos/actions";
import { PedidoDetail } from "@/components/pedidos/PedidoDetail";
import type { PedidoData } from "@/components/pedidos/PedidoDetail";

// ─── Types ──────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>;
}

// ─── Generate Metadata ─────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const result = await getPedidoByIdAction(id);

  if ("error" in result || !result.data) {
    return { title: "Pedido no encontrado | Envichips" };
  }

  return {
    title: `Pedido ${result.data.numeroPedido} | Envichips`,
  };
}

// ─── Page ───────────────────────────────────────────

export default async function PedidoDetailPage({ params }: Props) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const result = await getPedidoByIdAction(id);

  if ("error" in result) {
    notFound();
  }

  // Serialize dates to strings for client component
  const pedido = JSON.parse(JSON.stringify(result.data)) as PedidoData;

  if (!session.user.id) {
    redirect("/login");
  }

  const currentUser = {
    id: session.user.id,
    rol: (session.user as { rol: string }).rol,
  };

  return (
    <div className="p-4 sm:p-6">
      <PedidoDetail pedido={pedido} currentUser={currentUser} />
    </div>
  );
}
