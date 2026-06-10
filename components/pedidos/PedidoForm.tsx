"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  Minus,
  Package,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCOP } from "@/lib/format";
import {
  createPedidoAction,
  getClientesAction,
  getArticulosForPedidoAction,
  getDeudaWarningAction,
} from "@/app/(dashboard)/pedidos/actions";
import type { MetodoPago } from "@/lib/generated/prisma/client";

// ─── Types ──────────────────────────────────────────────

interface ClientResult {
  id: string;
  nombreCompleto: string;
  telefono: string | null;
  deuda: number;
}

interface ArticleResult {
  id: string;
  nombre: string;
  presentacion: string;
  precio: number;
  stockActual: number;
}

interface CartItem {
  articuloId: string;
  nombre: string;
  presentacion: string;
  precio: number;
  cantidad: number;
  subtotal: number;
}

// ─── Step Indicator ─────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = [
    { num: 1, label: "Cliente" },
    { num: 2, label: "Productos" },
    { num: 3, label: "Resumen" },
  ];

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center gap-2">
          <div
            className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors ${
              current === step.num
                ? "bg-primary text-primary-foreground"
                : current > step.num
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {current > step.num ? (
              <svg
                className="size-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
            ) : (
              step.num
            )}
          </div>
          <span
            className={`hidden text-sm sm:inline ${
              current === step.num
                ? "font-medium text-foreground"
                : "text-muted-foreground"
            }`}
          >
            {step.label}
          </span>
          {i < steps.length - 1 && (
            <div className="mx-1 h-px w-8 bg-border sm:mx-2 sm:w-12" />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── PedidoForm Component ───────────────────────────────

export function PedidoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = parseInt(searchParams.get("step") ?? "1", 10);

  // ── Wizard navigation ──
  const goTo = useCallback(
    (s: number) => {
      router.push(`/pedidos/create?step=${s}`);
    },
    [router],
  );

  // Validate step is 1-3
  const currentStep = step >= 1 && step <= 3 ? step : 1;

  // ── Form state ──
  const [clienteId, setClienteId] = useState<string | undefined>();
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteDeuda, setClienteDeuda] = useState(0);
  const [isVentaRapida, setIsVentaRapida] = useState(false);

  const [items, setItems] = useState<CartItem[]>([]);

  const [descuento, setDescuento] = useState(0);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("EFECTIVO");
  const [observaciones, setObservaciones] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Derived totals ──
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const total = Math.max(0, subtotal - descuento);
  const totalQty = items.reduce((sum, item) => sum + item.cantidad, 0);

  // ── Cart collapsible ──
  const [cartOpen, setCartOpen] = useState(true);

  // ── Feedback: last added product for animation ──
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const lastAddedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // ══════════════════════════════════════════════════
  // CART BUMP ANIMATION
  // ══════════════════════════════════════════════════
  const [cartBump, setCartBump] = useState(false);
  // Trigger bump animation when total quantity changes
  const prevQtyRef = useRef(0);
  useEffect(() => {
    if (totalQty > prevQtyRef.current) {
      setCartBump(true);
      const t = setTimeout(() => setCartBump(false), 400);
      prevQtyRef.current = totalQty;
      return () => clearTimeout(t);
    }
    prevQtyRef.current = totalQty;
  }, [totalQty]);

  // ── Step 1: Client search + browse ──
  const [clientQuery, setClientQuery] = useState("");
  const [clientResults, setClientResults] = useState<ClientResult[]>([]);
  const [clientLoading, setClientLoading] = useState(false);
  const [clientInitialLoading, setClientInitialLoading] = useState(true);
  const clientDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Load initial clients on mount (browse mode)
  useEffect(() => {
    let cancelled = false;
    setClientInitialLoading(true);
    getClientesAction("").then((res) => {
      if (cancelled) return;
      if ("data" in res) {
        setClientResults(res.data);
      }
      setClientInitialLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Search clients as user types
  useEffect(() => {
    // When query is cleared, restore initial browse list
    if (clientQuery.length < 2) {
      if (clientDebounceRef.current) clearTimeout(clientDebounceRef.current);
      setClientLoading(true);
      getClientesAction("").then((res) => {
        if ("data" in res) {
          setClientResults(res.data);
        }
        setClientLoading(false);
      });
      return;
    }

    if (clientDebounceRef.current) clearTimeout(clientDebounceRef.current);

    clientDebounceRef.current = setTimeout(async () => {
      setClientLoading(true);
      const res = await getClientesAction(clientQuery);
      if ("data" in res) {
        setClientResults(res.data);
      }
      setClientLoading(false);
    }, 300);

    return () => {
      if (clientDebounceRef.current) clearTimeout(clientDebounceRef.current);
    };
  }, [clientQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Step 2: Article search + browse ──
  const [articleQuery, setArticleQuery] = useState("");
  const [articleResults, setArticleResults] = useState<ArticleResult[]>([]);
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleInitialLoading, setArticleInitialLoading] = useState(true);
  const articleDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [addingArticleId, setAddingArticleId] = useState<string | null>(null);
  const [addingQuantity, setAddingQuantity] = useState(1);

  // Load initial articles on mount (browse mode)
  useEffect(() => {
    let cancelled = false;
    setArticleInitialLoading(true);
    getArticulosForPedidoAction("").then((res) => {
      if (cancelled) return;
      if ("data" in res) {
        setArticleResults(res.data);
      }
      setArticleInitialLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Search articles as user types
  useEffect(() => {
    // When query is cleared, restore initial browse list
    if (articleQuery.length < 2) {
      if (articleDebounceRef.current) clearTimeout(articleDebounceRef.current);
      setArticleLoading(true);
      getArticulosForPedidoAction("").then((res) => {
        if ("data" in res) {
          setArticleResults(res.data);
        }
        setArticleLoading(false);
      });
      return;
    }

    if (articleDebounceRef.current) clearTimeout(articleDebounceRef.current);

    articleDebounceRef.current = setTimeout(async () => {
      setArticleLoading(true);
      const res = await getArticulosForPedidoAction(articleQuery);
      if ("data" in res) {
        setArticleResults(res.data);
      }
      setArticleLoading(false);
    }, 300);

    return () => {
      if (articleDebounceRef.current) clearTimeout(articleDebounceRef.current);
    };
  }, [articleQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Real-time deuda refresh when FIADO + cliente on step 3
  useEffect(() => {
    if (currentStep === 3 && metodoPago === "FIADO" && clienteId) {
      getDeudaWarningAction(clienteId).then((res) => {
        if ("data" in res) {
          setClienteDeuda(res.data.deuda);
        }
      });
    }
  }, [currentStep, metodoPago, clienteId]);

  // ── Handlers ──

  const selectClient = (client: ClientResult) => {
    setClienteId(client.id);
    setClienteNombre(client.nombreCompleto);
    setClienteDeuda(client.deuda);
    setIsVentaRapida(false);
  };

  const unselectClient = () => {
    setClienteId(undefined);
    setClienteNombre("");
    setClienteDeuda(0);
    setIsVentaRapida(false);
  };

  /**
   * Venta rápida toggle: preserves clienteNombre across mode switches.
   * - OFF → ON: show name input, keep existing clienteNombre if any
   * - ON → OFF: show client list, keep clienteNombre in memory
   * Only clear clienteNombre on explicit "X" or new client selection.
   */
  const handleVentaRapidaToggle = useCallback(() => {
    setIsVentaRapida((prev) => {
      const next = !prev;
      // When turning ON: if a client was selected, unselect it
      if (next && clienteId) {
        // We can't call unselectClient here (hook rule), so schedule it
        // Use setTimeout to avoid state-during-render issues
        setTimeout(() => unselectClient(), 0);
      }
      return next;
    });
  }, [clienteId]);

  /**
   * Quick-add: click on a product row → adds 1 unit to cart.
   * Tap again → adds another unit. No quantity popup needed.
   */
  const handleQuickAdd = (article: ArticleResult) => {
    if (article.stockActual <= 0) return;

    // Visual feedback: show checkmark on the tapped row
    if (lastAddedTimer.current) clearTimeout(lastAddedTimer.current);
    setLastAddedId(article.id);
    lastAddedTimer.current = setTimeout(() => setLastAddedId(null), 600);

    setItems((prev) => {
      const existing = prev.find((i) => i.articuloId === article.id);
      if (existing) {
        return prev.map((i) =>
          i.articuloId === article.id
            ? {
                ...i,
                cantidad: i.cantidad + 1,
                subtotal: (i.cantidad + 1) * i.precio,
              }
            : i,
        );
      }
      return [
        ...prev,
        {
          articuloId: article.id,
          nombre: article.nombre,
          presentacion: article.presentacion,
          precio: article.precio,
          cantidad: 1,
          subtotal: article.precio,
        },
      ];
    });
  };

  const removeItem = (articuloId: string) => {
    setItems((prev) => prev.filter((i) => i.articuloId !== articuloId));
  };

  const increaseQty = (articuloId: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.articuloId === articuloId
          ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.precio }
          : i,
      ),
    );
  };

  const decreaseQty = (articuloId: string) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.articuloId !== articuloId) return i;
        if (i.cantidad <= 1) return i; // don't go below 1
        return { ...i, cantidad: i.cantidad - 1, subtotal: (i.cantidad - 1) * i.precio };
      }),
    );
  };

  const handleConfirm = async () => {
    setError(null);
    setSubmitting(true);

    try {
      const res = await createPedidoAction({
        clienteId: clienteId || undefined,
        clienteNombre: isVentaRapida && !clienteId ? clienteNombre : undefined,
        items: items.map((i) => ({
          articuloId: i.articuloId,
          cantidad: i.cantidad,
        })),
        metodoPago,
        descuento: descuento || 0,
        observaciones: observaciones || undefined,
      });

      if ("error" in res) {
        setError(res.error);
        setSubmitting(false);
        return;
      }

      router.push(`/pedidos/${res.data.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al crear el pedido",
      );
      setSubmitting(false);
    }
  };

  // ── Step 1 validation ──
  const step1Valid =
    clienteId !== undefined || (isVentaRapida && clienteNombre.trim().length > 0);
  // ── Step 2 validation ──
  const step2Valid = items.length > 0;

  // ── Render helpers ──

  const renderClientList = () => {
    if (clientInitialLoading) {
      return (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Cargando clientes...
        </div>
      );
    }

    if (clientLoading) {
      return (
        <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Buscando...
        </div>
      );
    }

    if (clientResults.length === 0) {
      return (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Users className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {clientQuery.length >= 2
              ? "No se encontraron clientes"
              : "No hay clientes registrados"}
          </p>
        </div>
      );
    }

    return (
      <ul className="divide-y">
        {clientResults.map((client) => (
          <li key={client.id}>
            <button
              type="button"
              onClick={() => selectClient(client)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm transition-colors hover:bg-accent cursor-pointer min-h-[52px]"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{client.nombreCompleto}</p>
                {client.telefono && (
                  <p className="text-xs text-muted-foreground">
                    {client.telefono}
                  </p>
                )}
              </div>
              {client.deuda > 0 ? (
                <Badge variant="warning" className="shrink-0">
                  Deuda: {formatCOP(client.deuda)}
                </Badge>
              ) : (
                <Badge variant="success" className="shrink-0">
                  AL DÍA
                </Badge>
              )}
            </button>
          </li>
        ))}
      </ul>
    );
  };

  const renderProductList = () => {
    if (articleInitialLoading) {
      return (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Cargando artículos...
        </div>
      );
    }

    if (articleLoading) {
      return (
        <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Buscando...
        </div>
      );
    }

    if (articleResults.length === 0) {
      return (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Package className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {articleQuery.length >= 2
              ? "No se encontraron artículos"
              : "No hay artículos disponibles"}
          </p>
        </div>
      );
    }

    return (
      <ul className="divide-y">
        {articleResults.map((article) => (
          <li key={article.id}>
            <button
              type="button"
              onClick={() => handleQuickAdd(article)}
              disabled={article.stockActual <= 0}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm transition-colors hover:bg-accent cursor-pointer min-h-[52px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{article.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {article.presentacion} &middot; Stock: {article.stockActual}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-semibold tabular-nums whitespace-nowrap">
                  {formatCOP(article.precio)}
                </span>
                <span
                  className={`flex size-7 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                    lastAddedId === article.id
                      ? "scale-125 bg-emerald-500 text-white"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {lastAddedId === article.id ? (
                    <CheckCircle className="size-4" />
                  ) : (
                    "+"
                  )}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    );
  };

  const renderCart = () => {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Todavía no agregaste productos
          </p>
        </div>
      );
    }

    return (
      <ul className="divide-y">
        {items.map((item) => (
          <li
            key={item.articuloId}
            className="flex items-center justify-between gap-3 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.nombre}</p>
              <p className="text-xs text-muted-foreground">
                {item.presentacion}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {/* Quantity controls */}
              <div className="flex items-center gap-1 rounded-lg border p-0.5">
                <button
                  type="button"
                  onClick={() => decreaseQty(item.articuloId)}
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
                      setItems((prev) =>
                        prev.map((i) =>
                          i.articuloId === item.articuloId
                            ? { ...i, cantidad: val, subtotal: val * i.precio }
                            : i,
                        ),
                      );
                    }
                  }}
                  className="w-12 text-center text-sm font-semibold tabular-nums rounded-md border border-input bg-transparent px-1 py-0.5 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  aria-label="Editar cantidad"
                />
                <button
                  type="button"
                  onClick={() => increaseQty(item.articuloId)}
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer"
                  aria-label="Aumentar cantidad"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
              <span className="text-sm font-medium tabular-nums min-w-[60px] text-right">
                {formatCOP(item.subtotal)}
              </span>
              <button
                type="button"
                onClick={() => removeItem(item.articuloId)}
                aria-label={`Quitar ${item.nombre}`}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </li>
        ))}
        <div className="flex items-center justify-between pt-3">
          <span className="text-sm font-medium">Subtotal</span>
          <span className="text-sm font-semibold tabular-nums">
            {formatCOP(subtotal)}
          </span>
        </div>
      </ul>
    );
  };

  // ── Render ──

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <StepIndicator current={currentStep} />

      {/* Global error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{error}</span>
          <Button
            variant="ghost"
            size="xs"
            className="ml-auto"
            onClick={() => setError(null)}
          >
            <X className="size-3" />
          </Button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
               STEP 1 — CLIENTE
          ═══════════════════════════════════════════════ */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 1: Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected client badge (when a client is selected) */}
            {clienteId ? (
              <div className="flex items-center justify-between gap-3 rounded-lg bg-primary/5 px-4 py-3">
                <div>
                  <p className="font-medium text-sm">{clienteNombre}</p>
                  {clienteDeuda > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Deuda: {formatCOP(clienteDeuda)}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={unselectClient}
                  aria-label="Quitar cliente"
                  className="cursor-pointer"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : isVentaRapida ? (
              /* Venta rápida name input */
              <div className="space-y-2">
                <Label htmlFor="clienteNombre">
                  Nombre del cliente
                </Label>
                <Input
                  id="clienteNombre"
                  placeholder="Ej: Cliente mostrador"
                  value={clienteNombre}
                  onChange={(e) => {
                    setClienteNombre(e.target.value);
                    if (clienteId) unselectClient();
                  }}
                  autoFocus
                  className="h-10"
                />
              </div>
            ) : (
              <>
                {/* Search + browse */}
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente por nombre..."
                    value={clientQuery}
                    onChange={(e) => setClientQuery(e.target.value)}
                    className="pl-9 h-10"
                    autoFocus
                  />
                </div>

                {/* Results list */}
                <div className="-mx-4 max-h-[320px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent">
                  {renderClientList()}
                </div>
              </>
            )}

            {/* Venta rápida toggle (always visible) */}
            <div className="flex items-center gap-3 pt-2 border-t">
              <button
                type="button"
                role="switch"
                aria-checked={isVentaRapida}
                onClick={handleVentaRapidaToggle}
                className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  isVentaRapida ? "bg-primary" : "bg-input"
                }`}
              >
                <span
                  className={`pointer-events-none block size-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${
                    isVentaRapida ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
              <div className="flex flex-col">
                <Label className="cursor-pointer" onClick={handleVentaRapidaToggle}>
                  Venta rápida
                </Label>
                <p className="text-xs text-muted-foreground">
                  Sin cliente registrado
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════
               STEP 2 — PRODUCTOS
          ═══════════════════════════════════════════════ */}
      {currentStep === 2 && (
        <div className="space-y-4">
          {/* Product browser */}
          <Card>
            <CardHeader>
              <CardTitle>Productos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar producto por nombre..."
                  value={articleQuery}
                  onChange={(e) => setArticleQuery(e.target.value)}
                  className="pl-9 h-10"
                  autoFocus
                />
              </div>

              {/* Product list */}
              <div className="-mx-4 max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent">
                {renderProductList()}
              </div>
            </CardContent>
          </Card>

          {/* Cart */}
          <Card>
            <CardHeader>
              <button
                type="button"
                onClick={() => setCartOpen(!cartOpen)}
                className="flex w-full items-center justify-between cursor-pointer"
              >
                <CardTitle>
                  <span className="flex items-center gap-2">
                    Carrito
                    <span
                      className={`inline-flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground tabular-nums transition-transform duration-300 ${
                        cartBump ? "scale-125" : "scale-100"
                      }`}
                    >
                      {totalQty}
                    </span>
                  </span>
                </CardTitle>
                {items.length > 0 && (
                  <span className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
                    {formatCOP(subtotal)}
                    {cartOpen ? (
                      <ChevronUp className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                  </span>
                )}
              </button>
            </CardHeader>
            {cartOpen && (
              <CardContent>
                {renderCart()}
              </CardContent>
            )}
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
               STEP 3 — RESUMEN
          ═══════════════════════════════════════════════ */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen del pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Client info */}
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="text-sm font-medium">
                  {clienteNombre || "Venta rápida"}
                </p>
              </div>

              {/* Items list */}
              <ul className="divide-y">
                {items.map((item) => (
                  <li
                    key={item.articuloId}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm">{item.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.cantidad} × {formatCOP(item.precio)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-medium tabular-nums">
                      {formatCOP(item.subtotal)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Totals */}
              <div className="space-y-1 border-t pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatCOP(subtotal)}</span>
                </div>
                {descuento > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Descuento</span>
                    <span className="tabular-nums text-destructive">
                      -{formatCOP(descuento)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-1 text-base font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCOP(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form fields */}
          <Card>
            <CardHeader>
              <CardTitle>Datos del pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Descuento */}
              <div className="space-y-2">
                <Label htmlFor="descuento">
                  Descuento (COP, opcional)
                </Label>
                <Input
                  id="descuento"
                  type="number"
                  min={0}
                  max={subtotal}
                  placeholder="0"
                  value={descuento || ""}
                  onChange={(e) =>
                    setDescuento(
                      Math.max(0, parseInt(e.target.value) || 0),
                    )
                  }
                  inputMode="numeric"
                />
              </div>

              {/* Metodo de pago */}
              <div className="space-y-2">
                <Label>Método de pago</Label>
                <div className="flex flex-wrap gap-2">
                  {(["EFECTIVO", "TRANSFERENCIA", "FIADO"] as MetodoPago[]).map(
                    (mp) => (
                      <button
                        key={mp}
                        type="button"
                        onClick={() => setMetodoPago(mp)}
                        className={`rounded-lg border px-4 py-2 text-sm transition-colors cursor-pointer ${
                          metodoPago === mp
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-input bg-transparent text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {mp === "EFECTIVO"
                          ? "Efectivo"
                          : mp === "TRANSFERENCIA"
                            ? "Transferencia"
                            : "Fiado"}
                      </button>
                    ),
                  )}
                </div>

                {/* FIADO debt warning */}
                {metodoPago === "FIADO" && clienteId && (
                  <>
                    {clienteDeuda === 0 ? (
                      <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950/30 dark:text-green-400">
                        <CheckCircle className="size-4 shrink-0" />
                        <span className="font-medium">Sin deuda</span>
                      </div>
                    ) : clienteDeuda >= 100_000 ? (
                      <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-400">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <div>
                          <p className="font-medium">
                            Deuda actual: {formatCOP(clienteDeuda)}
                          </p>
                          <p className="text-red-700 dark:text-red-500">
                            El cliente tiene una deuda elevada.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <div>
                          <p className="font-medium">
                            Deuda actual: {formatCOP(clienteDeuda)}
                          </p>
                          <p className="text-amber-700 dark:text-amber-500">
                            Este cliente tiene una deuda de{" "}
                            {formatCOP(clienteDeuda)} registrada.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Observaciones */}
              <div className="space-y-2">
                <Label htmlFor="observaciones">
                  Observaciones (opcional)
                </Label>
                <textarea
                  id="observaciones"
                  rows={3}
                  maxLength={500}
                  placeholder="Notas adicionales..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="h-20 w-full min-w-0 resize-y rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Navigation Buttons ─── */}
      <div className="flex items-center justify-between">
        {currentStep > 1 ? (
          <Button
            variant="outline"
            onClick={() => goTo(currentStep - 1)}
          >
            <ChevronLeft className="size-4" />
            Anterior
          </Button>
        ) : (
          <div />
        )}

        {currentStep < 3 ? (
          <Button
            onClick={() => goTo(currentStep + 1)}
            disabled={
              (currentStep === 1 && !step1Valid) ||
              (currentStep === 2 && !step2Valid)
            }
          >
            Siguiente
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button
            onClick={handleConfirm}
            disabled={submitting || items.length === 0}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creando...
              </>
            ) : (
              "Confirmar Pedido"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
