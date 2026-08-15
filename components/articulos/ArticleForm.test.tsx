import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ArticleForm } from "./ArticleForm";

// The form's server actions are stubbed — we assert on the payload the action
// receives to prove FormData carried the stockMinimo value.
const actionsMock = vi.hoisted(() => ({
  createArticuloAction: vi.fn(),
  updateArticuloAction: vi.fn(),
  deleteArticuloAction: vi.fn(),
}));

vi.mock("@/app/(dashboard)/articulos/actions", () => actionsMock);

// base-ui Select popups need real pointer/frame machinery that jsdom can't
// drive reliably. The select UI is NOT under test here — swap it for plain
// <select> elements so the real ArticleForm submit path stays fully exercised.
vi.mock("@/components/ui/select", async () => {
  const React = await import("react");

  type SelectMockProps = {
    value?: unknown;
    onValueChange?: (value: unknown) => void;
    children?: React.ReactNode;
  };

  return {
    SelectRoot: ({ value, onValueChange, children }: SelectMockProps) => (
      <select
        aria-label="select-mock"
        value={(value as string) ?? ""}
        onChange={(e) => onValueChange?.(e.target.value)}
      >
        {React.Children.map(children, (child) => child)}
      </select>
    ),
    SelectTrigger: ({ children }: SelectMockProps) => <>{children}</>,
    SelectValue: ({ children }: SelectMockProps) => <>{children}</>,
    SelectPopup: ({ children }: SelectMockProps) => <>{children}</>,
    SelectList: ({ children }: SelectMockProps) => <>{children}</>,
    SelectItem: ({ value, children }: SelectMockProps) => (
      <option value={value as string}>{children}</option>
    ),
  };
});

// Full Articulo shape so `initialData` satisfies the prop type in edit mode.
const EDIT_ARTICLE = {
  id: "art-1",
  nombre: "Papas Limón",
  categoria: "PAPA" as const,
  presentacion: "G50" as const,
  costo: 1000,
  precio: 2000,
  stockActual: 20,
  stockMinimo: 5,
  activo: true,
  creadoEn: new Date("2026-01-01T00:00:00.000Z"),
  pedidoItems: [],
  compraItems: [],
};

function renderEditMode(overrides: Record<string, unknown> = {}) {
  render(<ArticleForm mode="edit" initialData={{ ...EDIT_ARTICLE, ...overrides }} />);
}

function hiddenInputValue(name: string): string {
  const input = document.querySelector(`input[name="${name}"]`) as HTMLInputElement | null;
  if (!input) throw new Error(`hidden input [name="${name}"] not found`);
  return input.value;
}

async function fillFormAndSubmit(stockMinimo: string) {
  render(<ArticleForm mode="create" />);

  fireEvent.change(screen.getByLabelText("Nombre"), {
    target: { value: "Papas Limón" },
  });
  fireEvent.change(screen.getByLabelText("Costo ($)"), {
    target: { value: "1000" },
  });
  fireEvent.change(screen.getByLabelText("Precio ($)"), {
    target: { value: "2000" },
  });
  fireEvent.change(screen.getByLabelText("Stock Mínimo"), {
    target: { value: stockMinimo },
  });

  const [categoriaSelect, presentacionSelect] = screen.getAllByRole("combobox");
  fireEvent.change(categoriaSelect, { target: { value: "PAPA" } });
  fireEvent.change(presentacionSelect, { target: { value: "G50" } });

  fireEvent.submit(document.querySelector("form")!);
}

beforeEach(() => {
  vi.clearAllMocks();
  actionsMock.createArticuloAction.mockResolvedValue({ data: {} });
  actionsMock.updateArticuloAction.mockResolvedValue({ data: {} });
  actionsMock.deleteArticuloAction.mockResolvedValue({ data: {} });
});

describe("ArticleForm → stockMinimo transport", () => {
  it("3.1 create mode: submitted FormData carries stockMinimo=10 to the server action", async () => {
    await fillFormAndSubmit("10");

    await waitFor(() => {
      expect(actionsMock.createArticuloAction).toHaveBeenCalled();
    });

    expect(actionsMock.createArticuloAction).toHaveBeenCalledWith(
      expect.objectContaining({ stockMinimo: 10 }),
    );
  });

  it("3.2 edit mode: changing stockMinimo syncs the hidden input and submits the new value", async () => {
    renderEditMode();

    // Hidden input transports the controlled state — starts at the stored value
    expect(hiddenInputValue("stockMinimo")).toBe("5");

    fireEvent.change(screen.getByLabelText("Stock Mínimo"), {
      target: { value: "10" },
    });
    expect(hiddenInputValue("stockMinimo")).toBe("10");

    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => {
      expect(actionsMock.updateArticuloAction).toHaveBeenCalledWith(
        "art-1",
        expect.objectContaining({ stockMinimo: 10 }),
      );
    });
    expect(actionsMock.createArticuloAction).not.toHaveBeenCalled();
  });

  it("3.3 edit mode: untouched stockMinimo is excluded from the payload (preserved on partial update)", async () => {
    renderEditMode();

    // Only touch a different field — stockMinimo stays at its stored value
    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Papas Saborizadas" },
    });
    expect(hiddenInputValue("stockMinimo")).toBe("5");

    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => {
      expect(actionsMock.updateArticuloAction).toHaveBeenCalledWith(
        "art-1",
        expect.objectContaining({ nombre: "Papas Saborizadas" }),
      );
    });

    // Dirty-filtered payload must NOT carry stockMinimo — omitting it is what
    // lets the server preserve the original value on a partial update.
    const payload = actionsMock.updateArticuloAction.mock.calls[0]![1] as Record<
      string,
      unknown
    >;
    expect(payload).not.toHaveProperty("stockMinimo");
  });
});
