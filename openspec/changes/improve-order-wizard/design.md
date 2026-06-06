# Design: improve-order-wizard

## Architecture

### Component Changes

**Before:**
```
PedidoForm (973 lines, monolithic)
├── StepIndicator
├── Step 1: Cliente (search-only)
│   └── SearchInput → getClientesAction(query)
├── Step 2: Productos (search-only) + Cart
│   └── SearchInput → getArticulosForPedidoAction(query)
└── Step 3: Resumen + Datos del pedido
```

**After:**
```
PedidoForm (refactored, same structure but improved UX)
├── StepIndicator (unchanged)
├── Step 1: Cliente (browse + search)
│   ├── SearchInput → getClientesAction(query) [debounced]
│   ├── ClientList (loaded on mount via getClientesAction(""))
│   └── VentaRapidaToggle (fixed state management)
├── Step 2: Productos (browse + search) + Cart
│   ├── SearchInput → getArticulosForPedidoAction(query) [debounced]
│   ├── ProductGrid (loaded on mount via getArticulosForPedidoAction(""))
│   └── Cart (restyled, collapsible)
└── Step 3: Resumen (unchanged)
```

### State Management Changes

**Venta rápida toggle (critical fix):**
- Current: `unselectClient()` clears `clienteNombre` on toggle ON
- New: Separate mode state from client name state. When toggling:
  - OFF → ON: show name input, keep existing `clienteNombre` if any
  - ON → OFF: hide name input, show client list, KEEP `clienteNombre` in state
  - Only clear `clienteNombre` when: explicit X on badge, or new client selected

### Data Flow

```
Mount Step 1
  └─ getClientesAction("") → clientResults (first 20)
  └─ User types → debounce 300ms → getClientesAction(query) → clientResults (filtered)

Mount Step 2
  └─ getArticulosForPedidoAction("") → articleResults (first 20)
  └─ User types → debounce 300ms → getArticulosForPedidoAction(query) → articleResults (filtered)
```

## Server Action Changes

### getClientesAction
```typescript
// Current:
if (query.length < 2) return { data: [] };

// New:
const where: Prisma.ClienteWhereInput = { activo: true };
if (query.length >= 2) {
  where.nombreCompleto = { contains: query, mode: "insensitive" };
}
// ... findMany with where, take: 20, orderBy: nombreCompleto: "asc"
```

### getArticulosForPedidoAction
```typescript
// Current:
if (query.length < 2) return { data: [] };

// New:
const where: Prisma.ArticuloWhereInput = { activo: true };
if (query.length >= 2) {
  where.nombre = { contains: query, mode: "insensitive" };
}
// ... findMany with where, take: 20, orderBy: nombre: "asc"
```

## Mobile Layout

### Step 1 Layout
```
┌─────────────────────┐
│ 🔍 Buscar cliente   │ ← Search input, always visible
├─────────────────────┤
│ [Client List]        │
│ ┌─────────────────┐ │
│ │ Juan Pérez      │ │
│ │ 📞 3001234567   │ │
│ │ [Deuda: $50k]   │ │
│ ├─────────────────┤ │
│ │ María García    │ │
│ │ 📞 3007654321   │ │
│ │ [AL DÍA]        │ │
│ └─────────────────┘ │
│ (scrollable)        │
├─────────────────────┤
│ [🔄 Venta rápida]   │ ← Toggle at bottom
└─────────────────────┘
```

### Step 2 Layout (mobile)
```
┌─────────────────────┐
│ 🔍 Buscar artículo  │ ← Search input
├─────────────────────┤
│ Products (cards)     │
│ ┌──────┐ ┌──────┐   │
│ │ Papas│ │Pláta-│   │
│ │ G250 │ │no G65│   │
│ │$3,500│ │$2,000│   │
│ │[+Agr]│ │[+Agr]│   │
│ └──────┘ └──────┘   │
│ (2-col grid)        │
├─────────────────────┤
│ 🛒 3 items ($12,500)│ ← Collapsible cart header
│ (expanded: list)    │
└─────────────────────┘
```

## Preserved Behavior

- URL step navigation remains (`router.push(/pedidos/create?step=N)`)
- Validation logic unchanged (`step1Valid`, `step2Valid`)
- `handleConfirm` unchanged (uses same state variables)
- All error handling unchanged
- Step 3 (Resumen) untouched beyond minor layout adjustments
