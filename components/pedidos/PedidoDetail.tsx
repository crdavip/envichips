"use client";

import { useState, useTransition, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  DollarSign,
  Loader2,
  Minus,
  Pencil,
  Plus,
  Printer,
  Search,
  Trash2,
  Truck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectList,
  SelectItem,
} from "@/components/ui/select";
import { PedidoStatusBadge } from "@/components/pedidos/PedidoStatusBadge";
import { formatCOP } from "@/lib/format";
import {
  cancelarPedidoAction,
  confirmarCobroAdminAction,
  updateEstadoAction,
  asignarDomiciliarioAction,
  getDomiciliariosAction,
  modificarPedidoAction,
  getArticulosForPedidoAction,
} from "@/app/(dashboard)/pedidos/actions";
interface DomiciliarioResult {
  id: string;
  nombre: string;
}

// ─── Types ──────────────────────────────────────────────

interface HistorialEntry {
  id: string;
  estadoAntes: string;
  estadoDespues: string;
  cambiadoPor: { nombre: string } | null;
  creadoEn: string;
  motivo: string | null;
}

interface PedidoItemData {
  id: string;
  cantidad: number;
  precio: number;
  precioOriginal: number;
  subtotal: number;
  articulo: { id: string; nombre: string; presentacion: string };
}

interface ClienteData {
  nombreCompleto: string;
}

interface DomiciliarioData {
  id: string;
  nombre: string;
}

export interface PedidoData {
  id: string;
  numeroPedido: string;
  fecha: string;
  estado: string;
  metodoPago: string;
  tipoDescuento: string;
  subtotal: number;
  descuento: number;
  total: number;
  dineroCobrado: boolean | null;
  montoCobrado: number | null;
  estadoCobro: string;
  pagoEntregadoAdmin: boolean;
  pagoEntregadoEn: string | null;
  observaciones: string | null;
  cliente: ClienteData | null;
  domiciliario: DomiciliarioData | null;
  items: PedidoItemData[];
  historialEstados: HistorialEntry[];
}

interface CurrentUser {
  id: string;
  rol: string;
}

interface PedidoDetailProps {
  pedido: PedidoData;
  currentUser: CurrentUser;
}

// ─── Helpers ────────────────────────────────────────────

function formatFecha(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFechaCorta(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const metodoPagoLabel: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  FIADO: "Fiado",
};

function estadoLabel(estado: string): string {
  const labels: Record<string, string> = {
    PENDIENTE: "Pendiente",
    EN_CAMINO: "En Camino",
    ENTREGADO: "Entregado",
    CANCELADO: "Cancelado",
  };
  return labels[estado] ?? estado;
}

// ─── Timeline Item ──────────────────────────────────────

function TimelineEntry({
  entry,
  isLast,
}: {
  entry: HistorialEntry;
  isLast: boolean;
}) {
  // Derive semantic label when estadoAntes === estadoDespues (creation or cobro confirmation)
  const sameState = entry.estadoAntes === entry.estadoDespues;
  const displayLabel = sameState
    ? entry.motivo?.includes("creado")
      ? "Creado → Pendiente"
      : entry.motivo?.includes("Cobro")
        ? "Entregado → Pagado"
        : null
    : null;

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`size-3 shrink-0 rounded-full border-2 ${
            entry.estadoDespues === "CANCELADO"
              ? "border-destructive bg-destructive/20"
              : entry.estadoDespues === "ENTREGADO"
                ? "border-emerald-500 bg-emerald-100 dark:bg-emerald-900/30"
                : entry.estadoDespues === "EN_CAMINO"
                  ? "border-amber-500 bg-amber-100 dark:bg-amber-900/30"
                  : "border-muted-foreground bg-muted"
          }`}
        />
        {!isLast && <div className="w-px flex-1 bg-border" />}
      </div>
      <div className={isLast ? "pb-0" : "pb-4"}>
        <p className="text-sm font-medium">
          {displayLabel ?? `${estadoLabel(entry.estadoAntes)} → ${estadoLabel(entry.estadoDespues)}`}
        </p>
        <p className="text-xs text-muted-foreground">
          {entry.cambiadoPor?.nombre ?? "Sistema"} ·{" "}
          {formatFechaCorta(entry.creadoEn)}
        </p>
        {entry.motivo && !displayLabel && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Motivo: {entry.motivo}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────

export function PedidoDetail({ pedido, currentUser }: PedidoDetailProps) {
  const router = useRouter();

  // ── Modal States ────────────────────────────────────

  const [showEntregarModal, setShowEntregarModal] = useState(false);
  const [showCancelarModal, setShowCancelarModal] = useState(false);
  const [showConfirmCobroModal, setShowConfirmCobroModal] = useState(false);

  // ── Form States (Entregar) ──────────────────────────

  const [dineroCobrado, setDineroCobrado] = useState(true);
  const [montoCobrado, setMontoCobrado] = useState(
    pedido.total.toString(),
  );

  // ── Form States (Cancelar) ──────────────────────────

  const [motivo, setMotivo] = useState("");

  // ── Modal: domiciliario ────────────────────────────

  const [showDomiciliarioModal, setShowDomiciliarioModal] = useState(false);
  const [domiciliarios, setDomiciliarios] = useState<DomiciliarioResult[]>([]);
  const [selectedDomiciliarioId, setSelectedDomiciliarioId] = useState<
    string | undefined
  >(pedido.domiciliario?.id ?? undefined);
  const [isPendingDomiciliario, startTransitionDomiciliario] = useTransition();

  // ── Error / Pending ─────────────────────────────────
 
  const [error, setError] = useState<string | null>(null);
  const [isPendingEntregar, startTransitionEntregar] = useTransition();
  const [isPendingCamino, startTransitionCamino] = useTransition();
  const [isPendingCancelar, startTransitionCancelar] = useTransition();
  const [isPendingCobro, startTransitionCobro] = useTransition();

  // ── Modificar state ─────────────────────────────────

  interface ModificarItemState {
    articuloId: string;
    nombre: string;
    presentacion: string;
    cantidad: number;
    precio: number;
    precioOriginal: number;
    subtotal: number;
  }

  const [showModificarModal, setShowModificarModal] = useState(false);
  const [modificarItems, setModificarItems] = useState<ModificarItemState[]>(
    () =>
      pedido.items.map((i) => ({
        articuloId: i.articulo.id,
        nombre: i.articulo.nombre,
        presentacion: i.articulo.presentacion,
        cantidad: i.cantidad,
        precio: i.precio,
        precioOriginal: (i as any).precioOriginal ?? i.precio,
        subtotal: i.subtotal,
      })),
  );
  const [modificarMotivo, setModificarMotivo] = useState("");
  const [isSavingModificar, setIsSavingModificar] = useState(false);
  const [modificarError, setModificarError] = useState<string | null>(null);

  // ── Article browse (same pattern as PedidoForm) ──────
  const [articleQuery, setArticleQuery] = useState("");
  const [articleResults, setArticleResults] = useState<
    { id: string; nombre: string; presentacion: string; precio: number; stockActual: number }[]
  >([]);
  const [articleLoading, setArticleLoading] = useState(false);
  const articleDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [showArticleBrowser, setShowArticleBrowser] = useState(false);

  // Load all articles when browser opens (browse mode)
  useEffect(() => {
    if (!showArticleBrowser) return;
    let cancelled = false;
    setArticleLoading(true);
    getArticulosForPedidoAction("").then((res) => {
      if (cancelled) return;
      if ("data" in res) setArticleResults(res.data);
      setArticleLoading(false);
    });
    return () => { cancelled = true; };
  }, [showArticleBrowser]);

  // Search articles as user types (same debounce as PedidoForm)
  useEffect(() => {
    if (articleQuery.length < 2) {
      if (articleDebounceRef.current) clearTimeout(articleDebounceRef.current);
      setArticleLoading(true);
      getArticulosForPedidoAction("").then((res) => {
        if ("data" in res) setArticleResults(res.data);
        setArticleLoading(false);
      });
      return;
    }

    if (articleDebounceRef.current) clearTimeout(articleDebounceRef.current);
    articleDebounceRef.current = setTimeout(async () => {
      setArticleLoading(true);
      const res = await getArticulosForPedidoAction(articleQuery);
      if ("data" in res) setArticleResults(res.data);
      setArticleLoading(false);
    }, 300);

    return () => {
      if (articleDebounceRef.current) clearTimeout(articleDebounceRef.current);
    };
  }, [articleQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Role / State Checks ─────────────────────────────

  const isAdmin =
    currentUser.rol === "ADMIN" || currentUser.rol === "SUPERADMIN";
  const isDomiciliario = currentUser.rol === "DOMICILIARIO";
  const esMiPedido = pedido.domiciliario?.id === currentUser.id;

  const puedeMarcarCamino =
    pedido.estado === "PENDIENTE" &&
    (isAdmin || (isDomiciliario && esMiPedido));

  const puedeMarcarEntregado =
    pedido.estado === "EN_CAMINO" && (isAdmin || isDomiciliario);

  const puedeCancelar =
    (pedido.estado === "PENDIENTE" || pedido.estado === "EN_CAMINO") &&
    isAdmin;

  const puedeConfirmarCobro =
    pedido.estado === "ENTREGADO" &&
    pedido.estadoCobro === "COBRADO_PARCIAL" &&
    isAdmin;

  const puedeCambiarDomiciliario =
    (pedido.estado === "PENDIENTE" || pedido.estado === "EN_CAMINO") &&
    isAdmin;

  const puedeModificar =
    (pedido.estado === "PENDIENTE" || pedido.estado === "EN_CAMINO") &&
    (isAdmin || (isDomiciliario && pedido.domiciliario?.id === currentUser.id));

  // ── Actions ─────────────────────────────────────────

  // Load domiciliarios when modal opens
  const handleOpenDomiciliarioModal = useCallback(() => {
    setSelectedDomiciliarioId(pedido.domiciliario?.id ?? undefined);
    getDomiciliariosAction().then((res) => {
      if ("data" in res) {
        setDomiciliarios(res.data);
      }
    });
    setShowDomiciliarioModal(true);
  }, [pedido.domiciliario?.id]);

  const handleAsignarDomiciliario = useCallback(() => {
    startTransitionDomiciliario(async () => {
      setError(null);
      const res = await asignarDomiciliarioAction(pedido.id, {
        domiciliarioId: selectedDomiciliarioId ?? null,
      });
      if ("error" in res) {
        setError(res.error);
      } else {
        setShowDomiciliarioModal(false);
        router.refresh();
      }
    });
  }, [pedido.id, selectedDomiciliarioId, router]);

  const handleMarcarCamino = useCallback(() => {
    startTransitionCamino(async () => {
      setError(null);
      const res = await updateEstadoAction(pedido.id, {
        estado: "EN_CAMINO",
      });
      if ("error" in res) {
        setError(res.error);
      } else {
        router.refresh();
      }
    });
  }, [pedido.id, router]);

  const handleMarcarEntregado = useCallback(() => {
    startTransitionEntregar(async () => {
      setError(null);
      const res = await updateEstadoAction(pedido.id, {
        estado: "ENTREGADO",
        dineroCobrado,
        montoCobrado: dineroCobrado ? Number(montoCobrado) : 0,
      });
      if ("error" in res) {
        setError(res.error);
      } else {
        setShowEntregarModal(false);
        router.refresh();
      }
    });
  }, [pedido.id, dineroCobrado, montoCobrado, router]);

  const handleCancelar = useCallback(() => {
    if (!motivo.trim()) {
      setError("Debes ingresar un motivo para cancelar el pedido");
      return;
    }
    startTransitionCancelar(async () => {
      setError(null);
      const res = await cancelarPedidoAction(pedido.id, motivo.trim());
      if ("error" in res) {
        setError(res.error);
      } else {
        setShowCancelarModal(false);
        setMotivo("");
        router.refresh();
      }
    });
  }, [pedido.id, motivo, router]);

  const handleConfirmarCobro = useCallback(() => {
    startTransitionCobro(async () => {
      setError(null);
      const res = await confirmarCobroAdminAction(pedido.id);
      if ("error" in res) {
        setError(res.error);
      } else {
        setShowConfirmCobroModal(false);
        router.refresh();
      }
    });
  }, [pedido.id, router]);

  // ── Modificar handlers ─────────────────────────────

  const handleOpenModificar = useCallback(() => {
    setModificarItems(
      pedido.items.map((i) => ({
        articuloId: i.articulo.id,
        nombre: i.articulo.nombre,
        presentacion: i.articulo.presentacion,
        cantidad: i.cantidad,
        precio: i.precio,
        precioOriginal: (i as any).precioOriginal ?? i.precio,
        subtotal: i.subtotal,
      })),
    );
    setModificarMotivo("");
    setModificarError(null);
    setShowArticleBrowser(false);
    setArticleQuery("");
    setShowModificarModal(true);
  }, [pedido.items]);

  const handleModificarQtyChange = useCallback(
    (articuloId: string, newQty: number) => {
      if (newQty < 1) return;
      setModificarItems((prev) =>
        prev.map((item) =>
          item.articuloId === articuloId
            ? { ...item, cantidad: newQty, subtotal: newQty * item.precio }
            : item,
        ),
      );
    },
    [],
  );

  const handleRemoveModificarItem = useCallback(
    (articuloId: string) => {
      const item = modificarItems.find((i) => i.articuloId === articuloId);
      if (!item) return;
      if (
        !window.confirm(
          `¿Eliminar "${item.nombre}" del pedido? Esta acción no se puede deshacer.`,
        )
      )
        return;
      setModificarItems((prev) =>
        prev.filter((i) => i.articuloId !== articuloId),
      );
    },
    [modificarItems],
  );

  // Quick-add article (tap → add 1, same as PedidoForm)
  const handleQuickAddArticle = useCallback(
    (article: { id: string; nombre: string; presentacion: string; precio: number }) => {
      setModificarItems((prev) => {
        const existing = prev.find((i) => i.articuloId === article.id);
        if (existing) {
          return prev.map((i) =>
            i.articuloId === article.id
              ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.precio }
              : i,
          );
        }
        return [
          ...prev,
          {
            articuloId: article.id,
            nombre: article.nombre,
            presentacion: article.presentacion,
            cantidad: 1,
            precio: article.precio,
            precioOriginal: article.precio,
            subtotal: article.precio,
          },
        ];
      });
    },
    [],
  );

  const handleSaveModificar = useCallback(async () => {
    if (!modificarMotivo.trim()) {
      setModificarError("Debes ingresar un motivo para la modificación");
      return;
    }
    if (modificarItems.length === 0) {
      setModificarError("Debe incluir al menos un producto");
      return;
    }

    setIsSavingModificar(true);
    setModificarError(null);

    const res = await modificarPedidoAction(pedido.id, {
      items: modificarItems.map((i) => ({
        articuloId: i.articuloId,
        cantidad: i.cantidad,
        ...(pedido.tipoDescuento === "ESPECIAL"
          ? { precioPersonalizado: i.precio }
          : {}),
      })),
      motivo: modificarMotivo.trim(),
    });

    setIsSavingModificar(false);

    if ("error" in res) {
      setModificarError(res.error);
      return;
    }

    setShowModificarModal(false);
    router.refresh();
  }, [pedido.id, modificarItems, modificarMotivo, router]);

  // ── Render ──────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Header ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {pedido.numeroPedido}
          </h1>
          <span className="scale-110">
            <PedidoStatusBadge estado={pedido.estado} />
          </span>
        </div>

        {/* Acciones rápidas del header */}
        <div className="flex flex-wrap gap-2">
          {/* Marcar en camino */}
          {puedeMarcarCamino && (
            <Button
              size="sm"
              variant="default"
              disabled={isPendingCamino}
              onClick={handleMarcarCamino}
            >
              {isPendingCamino ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Truck className="size-4" />
              )}
              Marcar en camino
            </Button>
          )}

          {/* Marcar entregado */}
          {puedeMarcarEntregado && (
            <Button
              size="sm"
              variant="default"
              onClick={() => {
                if (pedido.metodoPago === "FIADO") {
                  setDineroCobrado(false);
                  setMontoCobrado("0");
                } else {
                  setDineroCobrado(true);
                  setMontoCobrado(pedido.total.toString());
                }
                setError(null);
                setShowEntregarModal(true);
              }}
            >
              <CheckCircle2 className="size-4" />
              Marcar entregado
            </Button>
          )}

          {/* Cancelar pedido */}
          {puedeCancelar && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                setMotivo("");
                setError(null);
                setShowCancelarModal(true);
              }}
            >
              <XCircle className="size-4" />
              Cancelar pedido
            </Button>
          )}

          {/* Modificar pedido */}
          {puedeModificar && (
            <Button
              size="sm"
              variant="default"
              onClick={() => {
                setError(null);
                handleOpenModificar();
              }}
            >
              <Pencil className="size-4" />
              Modificar pedido
            </Button>
          )}

          {/* Imprimir */}
          <Link
            href={`/pedidos/${pedido.id}/imprimir`}
            className="inline-flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium text-foreground transition-all hover:bg-muted"
          >
            <Printer className="size-3.5" />
            Imprimir
          </Link>
        </div>
      </div>

      {/* ── Info Section ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Fecha
              </dt>
              <dd className="text-sm">{formatFecha(pedido.fecha)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Cliente
              </dt>
              <dd className="text-sm">
                {pedido.cliente?.nombreCompleto ?? (
                  <span className="italic text-muted-foreground">
                    Venta rápida
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Domiciliario
              </dt>
              <dd className="flex items-center gap-2 text-sm">
                {pedido.domiciliario?.nombre ?? (
                  <span className="italic text-muted-foreground">&mdash;</span>
                )}
                {puedeCambiarDomiciliario && (
                  <button
                    type="button"
                    onClick={handleOpenDomiciliarioModal}
                    className="text-xs font-medium text-primary hover:underline cursor-pointer"
                  >
                    Cambiar
                  </button>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Método de pago
              </dt>
              <dd className="text-sm">
                {metodoPagoLabel[pedido.metodoPago] ?? pedido.metodoPago}
              </dd>
            </div>
            {pedido.tipoDescuento && pedido.tipoDescuento !== "NINGUNO" && (
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Tipo de descuento
                </dt>
                <dd className="text-sm">
                  <Badge variant={pedido.tipoDescuento === "ESPECIAL" ? "warning" : "default"}>
                    {pedido.tipoDescuento === "GLOBAL" ? "Global" : "Especial"}
                  </Badge>
                </dd>
              </div>
            )}
            {pedido.observaciones && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">
                  Observaciones
                </dt>
                <dd className="text-sm">{pedido.observaciones}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* ── Items Table ───────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Productos</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:px-4">
          {/* Desktop table */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artículo</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">Precio Unit.</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedido.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <span className="font-medium">
                        {item.articulo.nombre}
                      </span>
                      <span className="ml-1 text-xs text-muted-foreground">
                        {item.articulo.presentacion}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.cantidad}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.precio !== item.precioOriginal ? (
                        <span className="flex items-center justify-end gap-1">
                          <span className="text-xs text-muted-foreground line-through">{formatCOP(item.precioOriginal)}</span>
                          <span className="text-destructive font-medium">{formatCOP(item.precio)}</span>
                        </span>
                      ) : (
                        formatCOP(item.precio)
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatCOP(item.subtotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile list */}
          <div className="block sm:hidden">
            <div className="divide-y">
              {pedido.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {item.articulo.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.articulo.presentacion}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                      {item.precio !== item.precioOriginal ? (
                        <>
                          <span className="line-through">{formatCOP(item.precioOriginal)}</span>{' '}
                          <span className="text-destructive font-medium">{formatCOP(item.precio)}</span> c/u
                        </>
                      ) : (
                        <>{formatCOP(item.precio)} c/u</>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground tabular-nums">
                      ×{item.cantidad}
                    </p>
                    <p className="text-sm font-semibold tabular-nums whitespace-nowrap">
                      {formatCOP(item.subtotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="flex flex-col items-end gap-1 border-t px-4 py-3 sm:px-0">
            {(() => {
              const subtotalOriginal = pedido.tipoDescuento === "ESPECIAL"
                ? pedido.items.reduce((sum, i) => sum + ((i as any).precioOriginal ?? i.precio) * i.cantidad, 0)
                : pedido.subtotal;
              const ahorroEspecial = pedido.tipoDescuento === "ESPECIAL"
                ? pedido.items.reduce((sum, i) => {
                    const diff = ((i as any).precioOriginal ?? i.precio) - i.precio;
                    return sum + (diff > 0 ? diff * i.cantidad : 0);
                  }, 0)
                : 0;
              return (
                <>
                  <div className="flex w-full max-w-xs justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums">{formatCOP(subtotalOriginal)}</span>
                  </div>
                  {pedido.descuento > 0 && (
                    <div className="flex w-full max-w-xs justify-between text-sm">
                      <span className="text-muted-foreground">Descuento</span>
                      <span className="tabular-nums text-destructive">
                        -{formatCOP(pedido.descuento)}
                      </span>
                    </div>
                  )}
                  {ahorroEspecial > 0 && (
                    <div className="flex w-full max-w-xs justify-between text-sm">
                      <span className="text-muted-foreground">Descuento especial</span>
                      <span className="tabular-nums text-destructive">
                        -{formatCOP(ahorroEspecial)}
                      </span>
                    </div>
                  )}
                </>
              );
            })()}
            <div className="flex w-full max-w-xs justify-between border-t pt-1 text-sm font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatCOP(pedido.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Cobro Section ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Cobro</CardTitle>
        </CardHeader>
        <CardContent>
          {pedido.estado === "CANCELADO" ? (
            <p className="text-sm text-muted-foreground">
              Pedido cancelado &mdash; no aplica cobro.
            </p>
          ) : (
            <div className="space-y-3">
              {/* EstadoCobro badge */}
              <div className="flex items-center gap-3">
                {pedido.estadoCobro === "COBRADO" ? (
                  <>
                    <DollarSign className="size-5 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-600">
                      Cobrado &mdash;{" "}
                      {formatCOP(pedido.montoCobrado ?? pedido.total)}
                    </span>
                    <Badge variant="success">Recibido por administrador</Badge>
                  </>
                ) : pedido.estadoCobro === "COBRADO_PARCIAL" ? (
                  <>
                    <DollarSign className="size-5 text-amber-600" />
                    <span className="text-sm font-medium text-amber-600">
                      Cobrado por domiciliario &mdash; pendiente de confirmación
                    </span>
                    <Badge variant="warning">Por confirmar</Badge>
                  </>
                ) : pedido.metodoPago === "FIADO" ? (
                  <>
                    <span className="text-sm font-medium text-muted-foreground">
                      Fiado &mdash; pasa a deuda del cliente
                    </span>
                    <Badge variant="secondary">Fiado</Badge>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Pendiente de cobro</Badge>
                  </div>
                )}
              </div>

              {/* Payment method info */}
              <div className="text-xs text-muted-foreground">
                Método de pago:{" "}
                {pedido.metodoPago === "EFECTIVO"
                  ? "Efectivo"
                  : pedido.metodoPago === "TRANSFERENCIA"
                    ? "Transferencia"
                    : pedido.metodoPago === "FIADO"
                      ? "Fiado"
                      : pedido.metodoPago}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Timeline ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Estados</CardTitle>
        </CardHeader>
        <CardContent>
          {pedido.historialEstados.length > 0 ? (
            <div className="relative">
              {pedido.historialEstados.map((entry, i) => (
                <TimelineEntry
                  key={entry.id}
                  entry={entry}
                  isLast={i === pedido.historialEstados.length - 1}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay cambios de estado registrados.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Confirmar cobro button (below timeline) ────── */}
      {puedeConfirmarCobro && (
        <div className="flex justify-center">
          <Button
            variant="default"
            size="lg"
            disabled={isPendingCobro}
            onClick={() => {
              setError(null);
              setShowConfirmCobroModal(true);
            }}
          >
            {isPendingCobro ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <DollarSign className="size-4" />
            )}
            Confirmar recepción de efectivo
          </Button>
        </div>
      )}

      {/* ──────── MODALS ──────────────────────────────── */}

      {/* ── Modal: Marcar Entregado ──────────────────── */}
      <Dialog open={showEntregarModal} onOpenChange={setShowEntregarModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como Entregado</DialogTitle>
            <DialogDescription>
              Registra la información de cobro para el pedido{" "}
              {pedido.numeroPedido}.
            </DialogDescription>
          </DialogHeader>

          {pedido.metodoPago === "FIADO" ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4 text-sm">
                <p className="font-medium">Este pedido es FIADO</p>
                <p className="text-muted-foreground mt-1">
                  El cobro se registra como deuda del cliente. No necesitás
                  recibir el dinero ahora.
                </p>
              </div>
            </div>
          ) : pedido.metodoPago === "TRANSFERENCIA" ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4 text-sm">
                <p className="font-medium">
                  Este pedido es por TRANSFERENCIA
                </p>
                <p className="text-muted-foreground mt-1">
                  Confirmá si el cliente ya realizó la transferencia.
                </p>
              </div>
              <div className="space-y-2">
                <Label>¿El cliente realizó la transferencia?</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={dineroCobrado ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setDineroCobrado(true);
                      setMontoCobrado(pedido.total.toString());
                    }}
                  >
                    Sí
                  </Button>
                  <Button
                    type="button"
                    variant={!dineroCobrado ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setDineroCobrado(false);
                      setMontoCobrado("0");
                    }}
                  >
                    Todavía no
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Dinero cobrado toggle */}
              <div className="space-y-2">
                <Label>¿Recibiste el dinero del cliente?</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={dineroCobrado ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setDineroCobrado(true);
                      setMontoCobrado(pedido.total.toString());
                    }}
                  >
                    Sí
                  </Button>
                  <Button
                    type="button"
                    variant={!dineroCobrado ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setDineroCobrado(false);
                      setMontoCobrado("0");
                    }}
                  >
                    No
                  </Button>
                </div>
              </div>

              {/* Monto cobrado */}
              <div className="space-y-2">
                <Label htmlFor="montoCobrado">¿Cuánto te pagaron?</Label>
                <Input
                  id="montoCobrado"
                  type="number"
                  min={0}
                  disabled={!dineroCobrado}
                  value={montoCobrado}
                  onChange={(e) => setMontoCobrado(e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Monto en COP &middot;{" "}
                  {dineroCobrado
                    ? "Ingresa el monto que recibiste del cliente"
                    : "No se registra cobro porque no recibiste dinero"}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEntregarModal(false)}>
              Volver
            </Button>
            <Button
              disabled={isPendingEntregar}
              onClick={handleMarcarEntregado}
            >
              {isPendingEntregar && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Confirmar entrega
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Cancelar Pedido ───────────────────── */}
      <Dialog open={showCancelarModal} onOpenChange={setShowCancelarModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Pedido</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de cancelar el pedido {pedido.numeroPedido}?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo de cancelación *</Label>
            <textarea
              id="motivo"
              className="h-24 w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
              placeholder="Describe el motivo de la cancelación..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelarModal(false)}>
              Volver
            </Button>
            <Button
              variant="destructive"
              disabled={isPendingCancelar || !motivo.trim()}
              onClick={handleCancelar}
            >
              {isPendingCancelar && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Confirmar cancelación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Confirmar Recepción de Efectivo ────── */}
      <Dialog
        open={showConfirmCobroModal}
        onOpenChange={setShowConfirmCobroModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar recepción de efectivo</DialogTitle>
            <DialogDescription>
              Confirma que recibiste el efectivo del pedido{" "}
              {pedido.numeroPedido} (
              {pedido.montoCobrado
                ? formatCOP(pedido.montoCobrado)
                : formatCOP(pedido.total)}
              ).
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmCobroModal(false)}>
              Volver
            </Button>
            <Button
              disabled={isPendingCobro}
              onClick={handleConfirmarCobro}
            >
              {isPendingCobro && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Sí, confirmar recepción
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Cambiar Domiciliario ────────────────── */}
      <Dialog
        open={showDomiciliarioModal}
        onOpenChange={setShowDomiciliarioModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar domiciliario</DialogTitle>
            <DialogDescription>
              {pedido.domiciliario
                ? `Domiciliario actual: ${pedido.domiciliario.nombre}`
                : "Este pedido no tiene domiciliario asignado"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <SelectRoot
              value={selectedDomiciliarioId ?? "__none__"}
              onValueChange={(value) =>
                setSelectedDomiciliarioId(
                  value === "__none__" || value === null
                    ? undefined
                    : value,
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar domiciliario">
                  {selectedDomiciliarioId
                    ? domiciliarios.find(
                        (d) => d.id === selectedDomiciliarioId,
                      )?.nombre ?? "Seleccionar"
                    : "Sin domiciliario"}
                </SelectValue>
              </SelectTrigger>
              <SelectPopup>
                <SelectList>
                  <SelectItem value="__none__">
                    Sin domiciliario
                  </SelectItem>
                  {domiciliarios.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nombre}
                    </SelectItem>
                  ))}
                </SelectList>
              </SelectPopup>
            </SelectRoot>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDomiciliarioModal(false)}
            >
              Volver
            </Button>
            <Button
              disabled={isPendingDomiciliario}
              onClick={handleAsignarDomiciliario}
            >
              {isPendingDomiciliario && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Modificar Pedido ───────────────────── */}
      <Dialog open={showModificarModal} onOpenChange={setShowModificarModal}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modificar pedido</DialogTitle>
            <DialogDescription>
              Modificá los productos y cantidades del pedido{" "}
              {pedido.numeroPedido}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Items list */}
            {modificarItems.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No hay productos en el pedido. Agregá al menos uno.
              </p>
            ) : (
              <ul className="divide-y">
                {modificarItems.map((item) => (
                  <li
                    key={item.articuloId}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.nombre}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.presentacion} &middot;{" "}
                        <span className="tabular-nums">
                          {formatCOP(item.precio)}
                        </span>{" "}
                        c/u
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {/* Quantity controls */}
                      <div className="flex items-center gap-1 rounded-lg border p-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleModificarQtyChange(
                              item.articuloId,
                              item.cantidad - 1,
                            )
                          }
                          disabled={item.cantidad <= 1}
                          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          aria-label="Disminuir cantidad"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          value={item.cantidad}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === "") return;
                            const val = parseInt(raw, 10);
                            if (!isNaN(val) && val >= 1) {
                              handleModificarQtyChange(
                                item.articuloId,
                                val,
                              );
                            }
                          }}
                          className="w-12 text-center text-sm font-semibold tabular-nums rounded-md border border-input bg-transparent px-1 py-0.5 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          aria-label="Editar cantidad"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleModificarQtyChange(
                              item.articuloId,
                              item.cantidad + 1,
                            )
                          }
                          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      {/* Editable price for ESPECIAL mode */}
                      {pedido.tipoDescuento === "ESPECIAL" && (
                        <div className="flex items-center gap-1 ml-2">
                          <span className="text-xs text-muted-foreground">$</span>
                          <input
                            type="number"
                            min={0}
                            value={item.precio}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setModificarItems((prev) =>
                                prev.map((i) =>
                                  i.articuloId === item.articuloId
                                    ? { ...i, precio: Math.max(0, val), subtotal: i.cantidad * Math.max(0, val) }
                                    : i,
                                ),
                              );
                            }}
                            className="w-20 text-center text-sm tabular-nums rounded-md border border-input bg-transparent px-1 py-0.5 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                            aria-label="Editar precio"
                          />
                          {item.precio !== item.precioOriginal && (
                            <span className="text-xs text-muted-foreground line-through ml-1">
                              {formatCOP(item.precioOriginal)}
                            </span>
                          )}
                        </div>
                      )}
                      <span className="text-sm font-medium tabular-nums min-w-[60px] text-right">
                        {formatCOP(item.subtotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveModificarItem(item.articuloId)
                        }
                        aria-label={`Quitar ${item.nombre}`}
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Agregar producto — browse + quick-add (igual que PedidoForm) */}
            <div className="space-y-2">
              {!showArticleBrowser ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowArticleBrowser(true)}
                >
                  <Plus className="size-4" />
                  Agregar producto
                </Button>
              ) : (
                <div className="rounded-lg border p-3">
                  {/* Search */}
                  <div className="relative mb-3">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar producto por nombre..."
                      value={articleQuery}
                      onChange={(e) => setArticleQuery(e.target.value)}
                      className="pl-9"
                      autoFocus
                    />
                  </div>

                  {/* Product list */}
                  {articleLoading ? (
                    <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      {articleQuery.length < 2 ? "Cargando artículos..." : "Buscando..."}
                    </div>
                  ) : articleResults.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      {articleQuery.length >= 2
                        ? "No se encontraron artículos"
                        : "No hay artículos disponibles"}
                    </p>
                  ) : (
                    <div className="-mx-3 max-h-48 space-y-0.5 overflow-y-auto">
                      {articleResults.map((article) => (
                        <button
                          key={article.id}
                          type="button"
                          onClick={() => handleQuickAddArticle(article)}
                          disabled={article.stockActual <= 0}
                          className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{article.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {article.presentacion} &middot; Stock: {article.stockActual}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-semibold tabular-nums">
                            {formatCOP(article.precio)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => {
                      setShowArticleBrowser(false);
                      setArticleQuery("");
                    }}
                  >
                    Cerrar
                  </Button>
                </div>
              )}
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <Label htmlFor="modificar-motivo">
                Motivo de la modificación *
              </Label>
              <textarea
                id="modificar-motivo"
                className="h-24 w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                placeholder="Describí el motivo de la modificación..."
                value={modificarMotivo}
                onChange={(e) => setModificarMotivo(e.target.value)}
                required
              />
            </div>

            {/* Error */}
            {modificarError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {modificarError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowModificarModal(false)}
            >
              Cancelar
            </Button>
            <Button
              disabled={isSavingModificar || modificarItems.length === 0}
              onClick={handleSaveModificar}
            >
              {isSavingModificar && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
