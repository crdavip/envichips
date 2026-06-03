import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  PlusCircle,
  List,
  Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  {
    title: "Ventas hoy",
    value: "$0",
    icon: DollarSign,
    description: "Total de ventas del día",
  },
  {
    title: "Pedidos pendientes",
    value: "0",
    icon: ShoppingCart,
    description: "Pedidos por despachar",
  },
  {
    title: "Stock bajo",
    value: "0",
    icon: Package,
    description: "Artículos por reabastecer",
  },
  {
    title: "Clientes en deuda",
    value: "0",
    icon: Users,
    description: "Clientes con saldo pendiente",
  },
];

const quickActions = [
  {
    label: "Nuevo Pedido",
    href: "/dashboard/pedidos/nuevo",
    icon: PlusCircle,
  },
  {
    label: "Ver Artículos",
    href: "/dashboard/articulos",
    icon: List,
  },
  {
    label: "Registrar Abono",
    href: "/dashboard/clientes",
    icon: Banknote,
  },
];

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userName = session.user.name ?? "Usuario";

  return (
    <div className="p-6 space-y-6">
      {/* Welcome */}
      <h1 className="text-2xl font-bold">Bienvenido, {userName}</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Icon className="size-4" />
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Acciones rápidas</h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "flex items-center gap-2",
                )}
              >
                <Icon className="size-4" />
                {action.label}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
