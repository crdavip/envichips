import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getClienteByIdAction } from "@/app/(dashboard)/clientes/actions";
import { ClienteDetail } from "@/components/clientes/ClienteDetail";
import type { ClienteDetailData } from "@/components/clientes/ClienteDetail";

// ─── Types ──────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>;
}

// ─── Generate Metadata ─────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const result = await getClienteByIdAction(id);

  if ("error" in result || !result.data) {
    return { title: "Cliente no encontrado | Envichips" };
  }

  return {
    title: `${result.data.nombreCompleto} | Envichips`,
  };
}

// ─── Page ───────────────────────────────────────────

export default async function ClienteDetailPage({ params }: Props) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const result = await getClienteByIdAction(id);

  if ("error" in result || !result.data) {
    notFound();
  }

  // Serialize dates to strings for client component
  const cliente = JSON.parse(JSON.stringify(result.data)) as ClienteDetailData;

  const userRole = (session.user as { rol?: string }).rol;

  return (
    <div className="p-4 sm:p-6">
      <ClienteDetail cliente={cliente} userRole={userRole} />
    </div>
  );
}
