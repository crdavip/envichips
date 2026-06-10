import Link from "next/link";
import { auth } from "@/lib/auth";
import { roleGte } from "@/lib/auth/authorize";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  PlusCircle,
  List,
  Banknote,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getResumenDelDia } from "@/lib/services/informes";
import { formatCOP } from "@/lib/format";

const quickActions = [
  {
    label: "Nuevo Pedido",
    href: "/pedidos/create",
    icon: PlusCircle,
    description: "Crear un pedido nuevo",
  },
  {
    label: "Ver Artículos",
    href: "/articulos",
    icon: List,
    description: "Gestionar el catálogo",
  },
  {
    label: "Registrar Abono",
    href: "/clientes",
    icon: Banknote,
    description: "Registrar pago de cliente",
  },
];

function TrendBadge({
  direction,
  label,
}: {
  direction: "up" | "down" | "neutral";
  label: string;
}) {
  if (direction === "neutral") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        {label}
      </span>
    );
  }

  const Icon = direction === "up" ? TrendingUp : TrendingDown;
  const colorClass =
    direction === "up"
      ? "text-emerald-600"
      : "text-red-600";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        colorClass,
      )}
    >
      <Icon className="size-3" />
      {label}
    </span>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-1 h-3 w-20" />
      </CardContent>
    </Card>
  );
}

async function DashboardStatsCards() {
  const resumen = await getResumenDelDia();

  const stats = [
    {
      title: "Ventas hoy",
      value: formatCOP(resumen.ventasHoy),
      icon: DollarSign,
      description: "Total de ventas del día",
      trend: { direction: "up" as const, label: "Ventas del día" },
      accent: true,
    },
    {
      title: "Ganancia del día",
      value: formatCOP(resumen.gananciaHoy),
      icon: TrendingUp,
      description: "Ganancia bruta del día",
      trend: { direction: "up" as const, label: "Ganancia del día" },
      accent: false,
    },
    {
      title: "Pedidos pendientes",
      value: String(resumen.pedidosPendientes),
      icon: ShoppingCart,
      description: "Pedidos por despachar",
      trend: {
        direction: "neutral" as const,
        label: `${resumen.pedidosEntregados} entregados hoy`,
      },
      accent: false,
    },
    {
      title: "Stock bajo",
      value: String(resumen.stockBajo.count),
      icon: Package,
      description:
        resumen.stockBajo.count > 0
          ? `${resumen.stockBajo.count} productos por reabastecer`
          : "Artículos por reabastecer",
      trend: {
        direction: "down" as const,
        label: resumen.stockBajo.count > 0 ? "Revisar inventario" : "Stock suficiente",
      },
      accent: false,
    },
    {
      title: "Clientes en deuda",
      value: String(resumen.clientesEnDeuda),
      icon: Users,
      description: "Clientes con saldo pendiente",
      trend: {
        direction: "neutral" as const,
        label:
          resumen.clientesEnDeuda > 0
            ? `${formatCOP(resumen.totalACobrar)} por cobrar`
            : "Sin deudores",
      },
      accent: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            className={cn(
              "relative overflow-hidden transition-shadow hover:shadow-md",
              stat.accent && "ring-1 ring-primary/20",
            )}
          >
            {stat.accent && (
              <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-primary/10" />
            )}
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg",
                    stat.accent
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                <TrendBadge
                  direction={stat.trend.direction}
                  label={stat.trend.label}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name ?? "Usuario";
  const canQuickActions = roleGte(session?.user, "ADMIN");

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Welcome */}
      <div className="overflow-hidden rounded-xl bg-gradient-to-br from-primary to-brand-primary/80 px-6 py-6 text-primary-foreground shadow-lg sm:px-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Bienvenido, {userName}
        </h1>
        <p className="mt-1 text-sm text-primary-foreground/80">
          Resumen del negocio —{" "}
          {new Date().toLocaleDateString("es-AR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <DashboardStatsCards />
      </Suspense>

      {/* Quick Actions */}
      {canQuickActions && (
      <section>
        <h2 className="mb-3 text-lg font-semibold">Acciones rápidas</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className={cn(
                  "group flex items-center gap-4 rounded-xl border p-4 transition-all hover:border-primary/30 hover:shadow-sm",
                  "bg-card text-card-foreground",
                )}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-medium">{action.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      )}
    </div>
  );
}
