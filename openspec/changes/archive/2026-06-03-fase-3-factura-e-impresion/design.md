# Design: Fase 3 — Factura e Impresión

## Technical Approach

Create a client component print page that fetches pedido data using getPedidoByIdAction, renders a print-optimized invoice layout with brand header, pedido details, items table, and totals, then auto-triggers window.print() on mount. Uses Tailwind CSS with @media print queries to adapt layout for 58mm thermal, 80mm thermal, and A4 formats.

## Architecture Decisions

### Decision: Component Type

**Choice**: Client component with "use client" directive
**Alternatives considered**: Server component
**Rationale**: The print page needs to execute window.print() on mount using useEffect hook, which is only available in client components. While data fetching could be done server-side, the auto-print functionality requires client-side execution.

### Decision: CSS Approach

**Choice**: Tailwind CSS utility classes with dedicated print.css module
**Alternatives considered**: Inline styles, CSS modules, Tailwind with @media print in same file
**Rationale**: Following project conventions of using Tailwind CSS. Separating print styles into a dedicated CSS module improves maintainability and avoids cluttering the component file with complex media queries. This approach allows clean separation of screen vs print styles.

### Decision: Print Layout Structure

**Choice**: Single layout with responsive print media queries targeting specific width ranges
**Alternatives considered**: Separate components for each format, dynamic class switching based on detection
**Rationale**: Using CSS @media print with width ranges (0-56mm for 58mm thermal, 57-76mm for 80mm thermal, 77mm+ for A4) provides the most reliable cross-browser and cross-printer compatibility. This approach doesn't require browser printer detection APIs which are inconsistent.

### Decision: Brand Information

**Choice**: Hardcoded brand header with placeholder for phone
**Alternatives considered**: Fetch from config API, read from environment variables
**Rationale**: For Fase 3 implementation, brand information is static and unlikely to change frequently. Hardcoding keeps the implementation simple and focused on the core printing functionality. Can be enhanced in future phases to read from configuration.

### Decision: Element Visibility

**Choice**: Show navigation controls on screen, hide in print view
**Alternatives considered**: Show all elements both screen and print, completely separate screen/print views
**Rationale**: Following the spec requirement to hide navbar, sidebar, and interactive elements in print while keeping them visible on screen for usability. This provides the best user experience - users can navigate to the print page and see controls, but only the invoice prints.

## Data Flow

    Browser ──→ Next.js Route Handler ──→ getPedidoByIdAction (Server Action)
         │                              │
         │                              ▼
         │                        Prisma DB ──→ Pedido Data
         │
         ▼
    Client Component (useEffect) ──→ window.print()
         │
         ▼
    Print Styles (@media print) ──→ Printer/PDF

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `app/dashboard/pedidos/[id]/imprimir/page.tsx` | Replace | Convert from placeholder to functional print page with data fetching, invoice rendering, and auto-print |
| `app/dashboard/pedidos/[id]/imprimir/print.css` | Create | Dedicated CSS module for print-specific styles including @media queries for 58mm/80mm thermal and A4 |
| `openspec/specs/pedidos/spec.md` | Modify | Add new section 8 for factura-impresion capability (as specified in proposal) |

## Interfaces / Contracts

Reuses existing PedidoData interface from components/pedidos/PedidoDetail.tsx:

```typescript
interface PedidoItemData {
  id: string;
  cantidad: number;
  precio: number;
  subtotal: number;
  articulo: {
    nombre: string;
    presentacion: string;
  };
}

export interface PedidoData {
  id: string;
  numeroPedido: string;
  fecha: string;
  estado: string;
  metodoPago: string;
  subtotal: number;
  descuento: number;
  total: number;
  dineroCobrado: boolean | null;
  montoCobrado: number | null;
  pagoEntregadoAdmin: boolean;
  observaciones: string | null;
  cliente: {
    nombreCompleto: string;
  } | null;
  domiciliario: {
    id: string;
    nombre: string;
  } | null;
  items: PedidoItemData[];
  historialEstados: {
    id: string;
    estadoAntes: string;
    estadoDespues: string;
    cambiadoPor: {
      nombre: string;
    } | null;
    creadoEn: string;
    motivo: string | null;
  }[];
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | formatCOP utility function | Jest test verifying COP formatting with various amounts |
| Component | PrintPage renders correct data | Render with mock PedidoData, verify all required elements present |
| Component | Auto-print triggers | Mock window.print, verify useEffect calls it on mount |
| Visual | Print layout matches spec | Manual verification using browser print preview for 58mm, 80mm, and A4 |
| Integration | End-to-end print flow | Navigate to print page, verify data fetches, layout renders, print dialog opens |

## Migration / Rollout

No migration required. This change replaces a placeholder page with functional implementation.

Rollback plan:
1. Restore original placeholder content in app/dashboard/pedidos/[id]/imprimir/page.tsx
2. Delete app/dashboard/pedidos/[id]/imprimir/print.css
3. Revert openspec/specs/pedidos/spec.md to previous version

## Open Questions

- [ ] Should the brand phone number be configurable via environment variable for future flexibility?
- [ ] Should we add a manual print button as fallback if auto-print is blocked by popup blockers?
- [ ] Should we implement browser printer detection to serve different CSS based on actual printer capabilities?
