import { describe, it, expect, vi, beforeEach } from "vitest";
import { Suspense } from "react";
import type { AnchorHTMLAttributes } from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import ImprimirPage from "./page";

// Server actions are stubbed — we assert the page fetches config via
// getConfigAction and renders the phone only when the config says so.
const actionsMock = vi.hoisted(() => ({
  getPedidoByIdAction: vi.fn(),
  getConfigAction: vi.fn(),
}));

vi.mock("@/app/(dashboard)/pedidos/actions", () => ({
  getPedidoByIdAction: actionsMock.getPedidoByIdAction,
}));

vi.mock("@/app/(dashboard)/configuracion/actions", () => ({
  getConfigAction: actionsMock.getConfigAction,
}));

// next/link needs Next router context that jsdom doesn't provide — a plain
// <a> is enough since navigation is not under test here.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

// ─── Fixtures ───────────────────────────────────────

const PEDIDO = {
  id: "pedido-1",
  numeroPedido: "ENV-2026-00001",
  fecha: "2026-08-14T12:00:00.000Z",
  estado: "ENTREGADO",
  metodoPago: "EFECTIVO",
  tipoDescuento: "NINGUNO",
  subtotal: 50000,
  descuento: 0,
  total: 50000,
  dineroCobrado: true,
  montoCobrado: 50000,
  estadoCobro: "COBRADO_PARCIAL",
  pagoEntregadoAdmin: false,
  pagoEntregadoEn: null,
  observaciones: null,
  cliente: { nombreCompleto: "Juan Pérez" },
  domiciliario: null,
  items: [
    {
      id: "item-1",
      cantidad: 2,
      precio: 2000,
      precioOriginal: 2000,
      subtotal: 4000,
      articulo: { id: "art-1", nombre: "Papas Limón", presentacion: "G50" },
    },
  ],
  historialEstados: [],
};

const CONFIG = {
  id: "cfg-1",
  nombreNegocio: "Envichips",
  telefonoFactura: "300 555 0100",
  actualizadoEn: new Date("2026-01-01T00:00:00.000Z"),
  actualizadoPorId: null,
};

// The page suspends on `use(params)` — a Suspense boundary plus an awaited
// act flush are required to resolve the promise inside a React work cycle.
async function renderPage() {
  await act(async () => {
    render(
      <Suspense fallback={<div>loading…</div>}>
        <ImprimirPage params={Promise.resolve({ id: "pedido-1" })} />
      </Suspense>,
    );
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  // The page auto-triggers window.print() once data is ready — absorb it.
  window.print = vi.fn();
  actionsMock.getPedidoByIdAction.mockResolvedValue({ data: PEDIDO });
  actionsMock.getConfigAction.mockResolvedValue({ data: CONFIG });
});

describe("ImprimirPage → business phone on invoice", () => {
  it("3.4 fetches config via getConfigAction on mount (phone origin = config)", async () => {
    await renderPage();

    // Wait for the invoice content (both actions resolved)
    await screen.findByText("ENV-2026-00001");

    expect(actionsMock.getPedidoByIdAction).toHaveBeenCalledWith("pedido-1");
    expect(actionsMock.getConfigAction).toHaveBeenCalled();
  });

  it("3.5 renders the phone when telefonoFactura is configured", async () => {
    await renderPage();

    expect(await screen.findByText(/Tel: 300 555 0100/)).toBeTruthy();
  });

  it.each([null, ""])(
    "3.6 omits the phone when telefonoFactura is %s",
    async (telefonoFactura) => {
      actionsMock.getConfigAction.mockResolvedValue({
        data: { ...CONFIG, telefonoFactura },
      });

      await renderPage();

      // The invoice still renders — only the phone line is suppressed
      await screen.findByText("ENV-2026-00001");

      await waitFor(() => {
        expect(actionsMock.getConfigAction).toHaveBeenCalled();
      });
      expect(screen.queryByText(/Tel:/)).toBeNull();
    },
  );
});
