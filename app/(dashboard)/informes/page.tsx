import Link from "next/link";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getResumenDelDia, type DateRange } from "@/lib/services/informes";
import { formatCOP } from "@/lib/format";
import { db } from "@/lib/db";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  ClipboardList,
  Wallet,
  Bike,
  AlertTriangle,
  AlertCircle,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";

const subReportNav = [
  { title: "Ventas", href: "/informes/ventas", icon: BarChart3, description: "Desglose de ventas por producto" },
  { title: "Inventario", href: "/informes/inventario", icon: ClipboardList, description: "Stock actual y valorización" },
  { title: "Caja", href: "/informes/caja", icon: Wallet, description: "Movimientos y saldo de caja" },
  { title: "Ganancias", href: "/informes/ganancias", icon: TrendingUp, description: "Ganancia bruta y neta" },
  { title: "Domiciliarios", href: "/informes/domiciliarios", icon: Bike, description: "Rendimiento por domiciliario" },
];

async function MetricCards() {
  const resumen = await getResumenDelDia();

  const metrics = [
    {
      title: "Ventas del período",
      value: formatCOP(resumen.ventasHoy),
      subtitle: `${resumen.pedidosEntregados} pedidos entregados`,
      icon: DollarSign,
      alert: false,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Ganancia del período",
      value: formatCOP(resumen.gananciaHoy),
      subtitle: "Ganancia bruta",
      icon: TrendingUp,
      alert: false,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Pedidos pendientes",
      value: String(resumen.pedidosPendientes),
      subtitle: "Por despachar",
      icon: ShoppingCart,
      alert: resumen.pedidosPendientes > 0,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <Card key={m.title}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className={cn("flex size-8 items-center justify-center rounded-lg", m.bg, m.color)}>
                  <Icon className="size-4" />
                </span>
                {m.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tracking-tight">{m.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{m.subtitle}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

async function AlertCards() {
  const resumen = await getResumenDelDia();

  const alerts = [
    {
      title: "Stock bajo",
      value: String(resumen.stockBajo.count),
      icon: AlertTriangle,
      description: resumen.stockBajo.count > 0
        ? `${resumen.stockBajo.count} productos por reabastecer`
        : "Sin alertas de stock",
      alert: resumen.stockBajo.count > 0,
      productos: resumen.stockBajo.productos,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-200 dark:border-amber-800",
    },
    {
      title: "Sin stock",
      value: String(resumen.sinStock.count),
      icon: Ban,
      description: resumen.sinStock.count > 0
        ? `${resumen.sinStock.count} productos agotados`
        : "Todos los productos tienen stock",
      alert: resumen.sinStock.count > 0,
      productos: resumen.sinStock.productos,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950/30",
      border: "border-red-200 dark:border-red-800",
    },
    {
      title: "Clientes en deuda",
      value: String(resumen.clientesEnDeuda),
      icon: AlertCircle,
      description: resumen.clientesEnDeuda > 0
        ? `${formatCOP(resumen.totalACobrar)} por cobrar`
        : "Sin clientes en mora",
      alert: resumen.clientesEnDeuda > 0,
      productos: [],
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950/30",
      border: "border-orange-200 dark:border-orange-800",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {alerts.map((a) => {
        const Icon = a.icon;
        return (
          <Card
            key={a.title}
            className={cn(a.alert && a.border, a.alert && "ring-1")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className={cn("flex size-8 items-center justify-center rounded-lg", a.bg, a.color)}>
                  <Icon className="size-4" />
                </span>
                {a.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tracking-tight">{a.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{a.description}</p>
                    {a.alert && a.productos.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                    Ver lista ({a.productos.length})
                  </summary>
                  <ul className="mt-1 space-y-0.5">
                    {(a.productos as { id: string; nombre: string; stockActual?: number; stockMinimo?: number }[]).map((p) => (
                      <li key={p.id} className="text-xs text-muted-foreground">
                        {p.stockActual !== undefined ? (
                          <>{p.nombre} — <span className="font-medium">{p.stockActual}</span> / {p.stockMinimo}</>
                        ) : (
                          p.nombre
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function MetricSkeletons({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-28" />
            <Skeleton className="mt-1 h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function InformesPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Informes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Resumen del negocio — {new Date().toLocaleDateString("es-AR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Metric cards */}
      <Suspense fallback={<MetricSkeletons count={3} />}>
        <MetricCards />
      </Suspense>

      {/* Alert cards */}
      <Suspense fallback={<MetricSkeletons count={3} />}>
        <AlertCards />
      </Suspense>

      {/* Sub-report navigation */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Reportes detallados</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {subReportNav.map((report) => {
            const Icon = report.icon;
            return (
              <Link
                key={report.title}
                href={report.href}
                className={cn(
                  "group flex flex-col items-start gap-3 rounded-xl border p-4 transition-all hover:border-primary/30 hover:shadow-sm",
                  "bg-card text-card-foreground",
                )}
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-medium">{report.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {report.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
