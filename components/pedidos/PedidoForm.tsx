"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectList,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCOP } from "@/lib/format";
import {
  createPedidoAction,
  getClientesAction,
  getDomiciliariosAction,
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

interface DomiciliarioResult {
  id: string;
  nombre: string;
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

// ─── Search Results List (reusable) ─────────────────────

interface SearchResultListProps<T> {
  results: T[];
  renderItem: (item: T) => React.ReactNode;
  onSelect: (item: T) => void;
  selectedId?: string;
  loading: boolean;
  emptyMessage: string;
}

function SearchResultList<T extends { id: string }>({
  results,
  renderItem,
  onSelect,
  selectedId,
  loading,
  emptyMessage,
}: SearchResultListProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Buscando...
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {results.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onSelect(item)}
            className={`flex w-full items-start gap-3 px-3 py-3 text-left text-sm transition-colors hover:bg-accent ${
              selectedId === item.id ? "bg-accent/60" : ""
            }`}
          >
            {renderItem(item)}
          </button>
        </li>
      ))}
    </ul>
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
  const [domiciliarioId, setDomiciliarioId] = useState<string | undefined>();
  const [observaciones, setObservaciones] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Derived totals ──
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const total = Math.max(0, subtotal - descuento);

  // ── Step 1: Client search ──
  const [clientQuery, setClientQuery] = useState("");
  const [clientResults, setClientResults] = useState<ClientResult[]>([]);
  const [clientLoading, setClientLoading] = useState(false);
  const clientDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    if (clientQuery.length < 2) {
      const id = setTimeout(() => setClientResults([]), 0);
      return () => clearTimeout(id);
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
  }, [clientQuery]);

  // ── Step 2: Article search ──
  const [articleQuery, setArticleQuery] = useState("");
  const [articleResults, setArticleResults] = useState<ArticleResult[]>([]);
  const [articleLoading, setArticleLoading] = useState(false);
  const articleDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [addingArticleId, setAddingArticleId] = useState<string | null>(null);
  const [addingQuantity, setAddingQuantity] = useState(1);

  useEffect(() => {
    if (articleQuery.length < 2) {
      const id = setTimeout(() => setArticleResults([]), 0);
      return () => clearTimeout(id);
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
  }, [articleQuery]);

  // ── Step 3: Domiciliarios list + real-time deuda refresh ──
  const [domiciliarios, setDomiciliarios] = useState<DomiciliarioResult[]>([]);

  useEffect(() => {
    if (currentStep === 3) {
      getDomiciliariosAction().then((res) => {
        if ("data" in res) {
          setDomiciliarios(res.data);
        }
      });
    }
  }, [currentStep]);

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

  const openQuantityInput = (article: ArticleResult) => {
    setAddingArticleId(article.id);
    setAddingQuantity(1);
  };

  const confirmAddItem = () => {
    const article = articleResults.find((a) => a.id === addingArticleId);
    if (!article || addingQuantity < 1) return;

    setItems((prev) => {
      const existing = prev.find((i) => i.articuloId === article.id);
      if (existing) {
        return prev.map((i) =>
          i.articuloId === article.id
            ? {
                ...i,
                cantidad: i.cantidad + addingQuantity,
                subtotal: (i.cantidad + addingQuantity) * i.precio,
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
          cantidad: addingQuantity,
          subtotal: addingQuantity * article.precio,
        },
      ];
    });

    setAddingArticleId(null);
    setAddingQuantity(1);
    setArticleQuery("");
    setArticleResults([]);
  };

  const removeItem = (articuloId: string) => {
    setItems((prev) => prev.filter((i) => i.articuloId !== articuloId));
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
        domiciliarioId: domiciliarioId || undefined,
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
  const step1Valid = clienteId !== undefined || (isVentaRapida && clienteNombre.trim().length > 0);
  // ── Step 2 validation ──
  const step2Valid = items.length > 0;

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
            {/* Toggle: Venta rápida */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                role="switch"
                aria-checked={isVentaRapida}
                onClick={() => {
                  setIsVentaRapida(!isVentaRapida);
                  if (!isVentaRapida) {
                    unselectClient();
                  }
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  isVentaRapida ? "bg-primary" : "bg-input"
                }`}
              >
                <span
                  className={`pointer-events-none block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${
                    isVentaRapida ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
              <Label>Venta rápida (sin cliente registrado)</Label>
            </div>

            {isVentaRapida ? (
              <div className="space-y-2">
                <Label htmlFor="clienteNombre">Nombre del cliente</Label>
                <Input
                  id="clienteNombre"
                  placeholder="Ej: Cliente mostrador"
                  value={clienteNombre}
                  onChange={(e) => {
                    setClienteNombre(e.target.value);
                    if (clienteId) unselectClient();
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <>
                {/* Client search */}
                <div className="space-y-2">
                  <Label htmlFor="clientSearch">Buscar cliente</Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="clientSearch"
                      placeholder="Escribí nombre del cliente..."
                      value={clientQuery}
                      onChange={(e) => setClientQuery(e.target.value)}
                      className="pl-8"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Selected client badge */}
                {clienteId && (
                  <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-sm">
                    <span className="font-medium">{clienteNombre}</span>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={unselectClient}
                      aria-label="Quitar cliente"
                    >
                      <X className="size-3" />
                    </Button>
                  </div>
                )}

                {/* Results */}
                {!clienteId && (
                  <SearchResultList
                    results={clientResults}
                    loading={clientLoading}
                    emptyMessage={
                      clientQuery.length < 2
                        ? "Escribí al menos 2 caracteres para buscar"
                        : "No se encontraron clientes"
                    }
                    selectedId={clienteId}
                    onSelect={selectClient}
                    renderItem={(c) => (
                      <div className="flex w-full items-center justify-between">
                        <div>
                          <p className="font-medium">{c.nombreCompleto}</p>
                          {c.telefono && (
                            <p className="text-xs text-muted-foreground">
                              {c.telefono}
                            </p>
                          )}
                        </div>
                        {c.deuda > 0 && (
                          <Badge variant="warning" className="shrink-0">
                            Deuda: {formatCOP(c.deuda)}
                          </Badge>
                        )}
                      </div>
                    )}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════
               STEP 2 — PRODUCTOS
          ═══════════════════════════════════════════════ */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Article search */}
          <Card>
            <CardHeader>
              <CardTitle>Buscar artículos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Escribí nombre del artículo..."
                  value={articleQuery}
                  onChange={(e) => {
                    setArticleQuery(e.target.value);
                    setAddingArticleId(null);
                  }}
                  className="pl-8"
                  autoFocus
                />
              </div>

              {/* Results */}
              {articleQuery.length < 2 ? (
                <p className="py-2 text-center text-sm text-muted-foreground">
                  Escribí al menos 2 caracteres para buscar
                </p>
              ) : articleLoading ? (
                <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Buscando...
                </div>
              ) : articleResults.length === 0 ? (
                <p className="py-2 text-center text-sm text-muted-foreground">
                  No se encontraron artículos
                </p>
              ) : (
                <ul className="divide-y">
                  {articleResults.map((article) => (
                    <li
                      key={article.id}
                      className="flex items-center justify-between gap-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {article.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {article.presentacion} &middot;{" "}
                          {formatCOP(article.precio)}
                          <span
                            className={
                              article.stockActual <= 0
                                ? "ml-2 text-destructive"
                                : "ml-2 text-muted-foreground"
                            }
                          >
                            Stock: {article.stockActual}
                          </span>
                        </p>
                      </div>

                      {addingArticleId === article.id ? (
                        <div className="flex shrink-0 items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            max={Math.max(1, article.stockActual)}
                            value={addingQuantity}
                            onChange={(e) =>
                              setAddingQuantity(
                                Math.max(1, parseInt(e.target.value) || 1),
                              )
                            }
                            className="h-8 w-20 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            inputMode="numeric"
                            autoFocus
                          />
                          <Button size="sm" onClick={confirmAddItem}>
                            <Plus className="size-3" />
                            Agregar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setAddingArticleId(null)}
                          >
                            <X className="size-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openQuantityInput(article)}
                          disabled={article.stockActual <= 0}
                          className="shrink-0"
                        >
                          <Plus className="size-3" />
                          Agregar
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Cart */}
          <Card>
            <CardHeader>
              <CardTitle>
                Productos seleccionados ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Todavía no agregaste productos
                </p>
              ) : (
                <>
                  <ul className="divide-y">
                    {items.map((item) => (
                      <li
                        key={item.articuloId}
                        className="flex items-center justify-between gap-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {item.nombre}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.cantidad} × {formatCOP(item.precio)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-sm font-medium tabular-nums">
                            {formatCOP(item.subtotal)}
                          </span>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => removeItem(item.articuloId)}
                            aria-label={`Quitar ${item.nombre}`}
                          >
                            <Trash2 className="size-3 text-destructive" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between border-t pt-3">
                    <span className="text-sm font-medium">Subtotal</span>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatCOP(subtotal)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
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
                        className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
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

              {/* Domiciliario */}
              <div className="space-y-2">
                <Label htmlFor="domiciliario">
                  Domiciliario (opcional)
                </Label>
                <SelectRoot
                  value={domiciliarioId ?? "__none__"}
                  onValueChange={(value) =>
                    setDomiciliarioId(
                      value === "__none__" || value === null ? undefined : value,
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sin domiciliario (venta directa)">
                      {domiciliarioId
                        ? domiciliarios.find((d) => d.id === domiciliarioId)
                            ?.nombre ?? "Seleccionar"
                        : "Sin domiciliario (venta directa)"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectList>
                      <SelectItem value="__none__">
                        Sin domiciliario (venta directa)
                      </SelectItem>
                      {domiciliarios.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.nombre}
                        </SelectItem>
                      ))}
                    </SelectList>
                  </SelectPopup>
                </SelectRoot>
                <p className="text-xs text-muted-foreground">
                  {domiciliarioId
                    ? "Con domiciliario asignado → Pedido en PENDIENTE"
                    : "Sin domiciliario → Pedido en ENTREGADO directo"}
                </p>
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
