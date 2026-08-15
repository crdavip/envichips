import { describe, it, expect, beforeEach, vi } from "vitest";
import type { UpdateEstadoInput } from "@/lib/validations/pedidos";
import { actualizarEstado, confirmarCobroAdmin, cancelarPedido } from "./pedidos";

// ─── Mocks ─────────────────────────────────────────
// The sync helper must use `tx.movimiento.*` (transaction-scoped), never the
// global `db` — so we mock `@/lib/db` to unwrap the transaction callback with
// a controllable tx mock.

const mocks = vi.hoisted(() => ({
  tx: {
    pedido: {
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    articulo: {
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    registroVisita: { create: vi.fn() },
    historialEstado: { create: vi.fn() },
    movimiento: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
  db: {
    $transaction: vi.fn(),
    // cancelarPedido reads the pedido through the GLOBAL db (not tx) first
    pedido: { findUniqueOrThrow: vi.fn() },
  },
}));

vi.mock("@/lib/db", () => ({ db: mocks.db }));

// ─── Helpers ───────────────────────────────────────

const ADMIN_USER = { id: "user-1", rol: "ADMIN" as const };

function setupTx(overrides: Record<string, unknown> = {}) {
  const pedido = {
    id: "pedido-1",
    numeroPedido: "ENV-2026-00001",
    estado: "PENDIENTE",
    metodoPago: "EFECTIVO",
    total: 50000,
    clienteId: "cliente-1",
    domiciliarioId: null,
    items: [{ articuloId: "art-1", cantidad: 2 }],
    ...overrides,
  };

  mocks.tx.pedido.findUniqueOrThrow.mockResolvedValue(pedido);
  mocks.tx.pedido.update.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
    Promise.resolve({ ...pedido, ...data }),
  );
  mocks.tx.articulo.findUniqueOrThrow.mockResolvedValue({ stockActual: 100, nombre: "Papas" });
  mocks.tx.articulo.update.mockResolvedValue({});
  mocks.tx.registroVisita.create.mockResolvedValue({});
  mocks.tx.historialEstado.create.mockResolvedValue({});
  mocks.tx.movimiento.findUnique.mockResolvedValue(null);
  mocks.tx.movimiento.create.mockResolvedValue({ id: "mov-1" });

  return pedido;
}

function deliver(raw: Partial<UpdateEstadoInput>) {
  return actualizarEstado("pedido-1", raw as UpdateEstadoInput, ADMIN_USER);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.db.$transaction.mockImplementation((cb: (tx: unknown) => unknown) => cb(mocks.tx));
});

// ─── RED: sync scenarios ───────────────────────────

describe("actualizarEstado → caja sync", () => {
  it("2.1 EFECTIVO + dineroCobrado=true creates exactly one INGRESO/VENTA_PEDIDO with monto=total", async () => {
    const pedido = setupTx({ metodoPago: "EFECTIVO" });

    await deliver({ estado: "ENTREGADO", dineroCobrado: true });

    expect(mocks.tx.movimiento.create).toHaveBeenCalledTimes(1);
    expect(mocks.tx.movimiento.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: "INGRESO",
          categoria: "VENTA_PEDIDO",
          monto: pedido.total,
          metodoPago: "EFECTIVO",
          registradoPorId: ADMIN_USER.id,
          pedidoId: "pedido-1",
          descripcion: "Venta pedido ENV-2026-00001",
        }),
      }),
    );
  });

  it("2.1b monto uses montoCobrado when provided, falling back to total", async () => {
    setupTx({ metodoPago: "EFECTIVO" });

    await deliver({ estado: "ENTREGADO", dineroCobrado: true, montoCobrado: 45000 });

    expect(mocks.tx.movimiento.create).toHaveBeenCalledTimes(1);
    expect(mocks.tx.movimiento.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ monto: 45000 }),
      }),
    );
  });

  it("2.2 TRANSFERENCIA creates exactly one INGRESO with metodoPago=TRANSFERENCIA", async () => {
    setupTx({ metodoPago: "TRANSFERENCIA" });

    await deliver({ estado: "ENTREGADO" });

    expect(mocks.tx.movimiento.create).toHaveBeenCalledTimes(1);
    expect(mocks.tx.movimiento.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: "INGRESO",
          categoria: "VENTA_PEDIDO",
          metodoPago: "TRANSFERENCIA",
          monto: 50000,
        }),
      }),
    );
  });

  it("2.3 EFECTIVO sin cobrar (dineroCobrado=false) makes zero movimiento operations", async () => {
    setupTx({ metodoPago: "EFECTIVO" });

    await deliver({ estado: "ENTREGADO", dineroCobrado: false });

    expect(mocks.tx.movimiento.create).not.toHaveBeenCalled();
    expect(mocks.tx.movimiento.findUnique).not.toHaveBeenCalled();
  });

  it("2.4 FIADO makes zero movimiento operations", async () => {
    setupTx({ metodoPago: "FIADO" });

    await deliver({ estado: "ENTREGADO" });

    expect(mocks.tx.movimiento.create).not.toHaveBeenCalled();
    expect(mocks.tx.movimiento.findUnique).not.toHaveBeenCalled();
  });

  it("2.5 pre-existing movimiento for the pedido prevents a second create (idempotency)", async () => {
    setupTx({ metodoPago: "EFECTIVO" });
    mocks.tx.movimiento.findUnique.mockResolvedValue({ id: "mov-existente" });

    await deliver({ estado: "ENTREGADO", dineroCobrado: true });

    expect(mocks.tx.movimiento.findUnique).toHaveBeenCalledWith({
      where: { pedidoId: "pedido-1" },
    });
    expect(mocks.tx.movimiento.create).not.toHaveBeenCalled();
  });
});

describe("confirmarCobroAdmin → caja sync", () => {
  it("2.6 never touches movimiento (no-duplicate contract)", async () => {
    mocks.tx.pedido.findUniqueOrThrow.mockResolvedValue({
      id: "pedido-1",
      pagoEntregadoAdmin: false,
      estado: "ENTREGADO",
    });
    mocks.tx.pedido.update.mockResolvedValue({ id: "pedido-1" });
    mocks.tx.historialEstado.create.mockResolvedValue({});

    await confirmarCobroAdmin("pedido-1", "user-1");

    expect(mocks.tx.movimiento.create).not.toHaveBeenCalled();
    expect(mocks.tx.movimiento.findUnique).not.toHaveBeenCalled();
  });
});

describe("cancelarPedido → caja sync", () => {
  it("2.7 cancelling a pedido (CANCELADO) creates no movimiento — sync only fires on ENTREGADO", async () => {
    mocks.db.pedido.findUniqueOrThrow.mockResolvedValue({
      id: "pedido-1",
      estado: "PENDIENTE",
    });
    mocks.tx.pedido.update.mockResolvedValue({ id: "pedido-1", estado: "CANCELADO" });
    mocks.tx.historialEstado.create.mockResolvedValue({});

    await cancelarPedido("pedido-1", "cliente canceló el pedido", "user-1");

    // The cancellation path must never touch caja
    expect(mocks.tx.movimiento.create).not.toHaveBeenCalled();
    expect(mocks.tx.movimiento.findUnique).not.toHaveBeenCalled();

    // It still performs the cancellation bookkeeping
    expect(mocks.tx.pedido.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ estado: "CANCELADO" }),
      }),
    );
    expect(mocks.tx.historialEstado.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estadoDespues: "CANCELADO",
          motivo: "cliente canceló el pedido",
        }),
      }),
    );
  });
});
