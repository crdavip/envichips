import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { roleGte } from "@/lib/auth/authorize";
import { ArticleList } from "@/components/articulos/ArticleList";

export const metadata: Metadata = {
  title: "Artículos | Envichips",
  description: "Catálogo de productos",
};

export default async function ArticulosPage() {
  const session = await auth();
  const userRole = (session?.user as { rol?: string } | undefined)?.rol;

  if (!session || !roleGte(session.user, "ADMIN")) {
    redirect("/no-autorizado");
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <ArticleList userRole={userRole} />
    </div>
  );
}
