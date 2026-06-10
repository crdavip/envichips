import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { roleGte } from "@/lib/auth/authorize";
import { ClienteList } from "@/components/clientes/ClienteList";

export const metadata: Metadata = {
  title: "Clientes | Envichips",
  description: "Gestión de cartera de clientes",
};

export default async function ClientesPage() {
  const session = await auth();

  if (!session?.user || !roleGte(session.user, "ADMIN")) {
    redirect("/no-autorizado");
  }

  const userRole = (session.user as any).rol as string | undefined;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <ClienteList userRole={userRole} />
    </div>
  );
}
