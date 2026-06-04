import { Suspense } from "react";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PedidoForm } from "@/components/pedidos/PedidoForm";

export const metadata: Metadata = {
  title: "Nuevo Pedido | Envichips",
  description: "Crear un nuevo pedido",
};

export default async function CreatePedidoPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <svg
            className="size-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </span>
        <div>
          <h1 className="text-xl font-semibold">Nuevo Pedido</h1>
          <p className="text-sm text-muted-foreground">
            Completá los pasos para registrar un pedido
          </p>
        </div>
      </div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
            Cargando formulario...
          </div>
        }
      >
        <PedidoForm />
      </Suspense>
    </div>
  );
}
