# Design: Sortable CRUD Columns

## Technical Approach

Shared `useSort<T>` hook providing typed, null-safe client-side sorting with accessor support for computed fields. A `SortBar` dropdown component for mobile card parity across all 8 list components. Server actions gain optional `sortBy`/`sortOrder` params to establish the future server-side contract. Sort is **client-side**, applied after filtering, and before pagination where applicable (CajaTable).

## Architecture Decisions

| Decision | Option | Tradeoff | Choice |
|---|---|---|---|
| Sort execution layer | Client-side vs server-side vs hybrid | Client: instant, no backend changes, but doesn't scale past full dataset fetch. Server: scales but requires rewriting all services/actions. | **Hybrid** — client sort now with server-ready action contracts |
| Hook API shape | Config object vs builder pattern | Config: declarative, one call. Builder: more flexible but verbose. | **Config object** — matches existing project patterns |
| Accessor strategy | Key-based vs function-based | Key: simple for direct fields but breaks on `ganancia` (computed). Function: slightly more verbose but handles everything uniformly. | **Function-based accessor** — default `item[key]`, explicit for computed |
| Mobile sort UI | Dropdown vs segmented control vs icon buttons | Dropdown: scales to N columns, matches existing `SelectRoot`. Segments: good for 2-3 fields only. Icons: takes too much space on mobile. | **Dropdown** (SortBar) — uses existing `SelectRoot` component |
| Null policy | Nulls-first vs nulls-last | First: unusual expectation. Last: matches SQL `ORDER BY ... NULLS LAST`. | **Nulls-last** — always sort null to end regardless of direction |
| Sort state location | Inside hook vs lifted to component | Inside: encapsulation. Lifted: more visible but exposes internals. | **Inside useSort** — returns `handleSort` + `SortIcon` component |

## Data Flow

```
┌──────────┐     ┌─────────────────────┐     ┌──────────┐
│ Server / │     │  Component          │     │  Table   │
│ Props    │────→│                     │────→│  /Cards  │
└──────────┘     │  filter() → hook    │     └──────────┘
                 │                     │
┌──────────┐     │  useSort({          │
│  User    │────→│    data: filtered,  │
│  Click   │     │    config,          │
└──────────┘     │    defaultBy        │
                 │  }) → { sorted,     │
                 │    handleSort,      │
                 │    SortIcon }       │
                 └─────────────────────┘
                          │
            CajaTable only: sorted → .slice(page) → render
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `lib/hooks/useSort.ts` | **Create** | Generic sort hook with accessors, type dispatch, nulls-last |
| `components/ui/sort-controls.tsx` | **Create** | `SortBar` dropdown using `SelectRoot` for mobile card views |
| `components/articulos/ArticleList.tsx` | Modify | Replace inline sort with useSort; add 6 new sortable columns; add SortBar in card grid |
| `components/clientes/ClienteList.tsx` | Modify | Replace inline sort; add 6 new sortable columns (telefono, estado, deuda, ultimaVisita); add SortBar |
| `components/pedidos/PedidoList.tsx` | Modify | Replace hardcoded fecha-desc with useSort; unified sort across 3 layout variants; add SortBar |
| `components/usuarios/UsuariosTable.tsx` | Modify | Add useSort with all 7 columns; add SortBar above mobile cards |
| `components/informes/InventarioTable.tsx` | Modify | Add `estado` column sort (enum string); add SortBar |
| `components/informes/VentasTable.tsx` | Modify | Add `nombre` column sort (string); add SortBar |
| `components/informes/DomiciliariosTable.tsx` | Modify | Add `nombre` column sort (string); add SortBar |
| `components/informes/CajaTable.tsx` | Modify | Add useSort for all 6 columns; apply sort **before** pagination slice; add SortBar |
| `app/(dashboard)/articulos/actions.ts` | Modify | Add optional `sortBy`/`sortOrder` to `getArticulosAction` |
| `app/(dashboard)/clientes/actions.ts` | Modify | Add optional `sortBy`/`sortOrder` to `getClientesAction` |
| `app/(dashboard)/pedidos/actions.ts` | Modify | Add optional `sortBy`/`sortOrder` to `getPedidosAction` |
| `app/(dashboard)/usuarios/actions.ts` | Modify | Add optional `sortBy`/`sortOrder` to relevant query actions |
| `lib/services/informes.ts` | Modify | Add optional `sortBy`/`sortOrder` to `getVentas`, `getInventario`, `getDomiciliarios` |

## useSort API

```typescript
// lib/hooks/useSort.ts
interface SortFieldConfig<T> {
  key: string;
  label: string;
  type: "string" | "number" | "date";
  nullsLast?: boolean;
  accessor?: (item: T) => string | number | Date | null;
}

interface UseSortConfig<T> {
  data: T[];
  config: SortFieldConfig<T>[];
  defaultSortBy: string;
  defaultSortDir?: "asc" | "desc";
}

interface UseSortReturn<T> {
  sorted: T[];
  sortBy: string;
  sortOrder: "asc" | "desc";
  handleSort: (field: string) => void;
  SortIcon: (field: string) => JSX.Element | null;
  serverPayload: { sortBy: string; sortOrder: string };
}
```

**Default accessor**: `(item: T) => item[key as keyof T]` — covers direct fields like `nombre`, `precio`, `stockActual`. **Explicit accessor** for computed fields:

```typescript
// In ArticleList — ganancia accessor
{ key: "ganancia", label: "Ganancia", type: "number",
  accessor: (a: Articulo) => a.precio - a.costo }
```

**Internal comparator** dispatches by type: string→`localeCompare`, number→diff, date→`new Date(v).getTime()`, null→always last.

## Key Implementation Details

- **SortBar**: Renders above mobile card grid (`lg:hidden` block in CRUD, `md:hidden` in reports). Uses `SelectRoot` for field picker + a direction toggle icon button (ArrowUp/ArrowDown).
- **CajaTable sort → paginate**: `const sortedItems = useSort(movimientos)` → `const pageItems = sortedItems.slice(start, end)` — sort is the outer pipeline, slice is inner.
- **PedidoList 3-variant sort**: Single `useSort` call in Admin return path, same for DOMICILIARIO. The `sorted` array feeds all 3 layout branches. SortBar appears in each card grid.
- **Enum columns** (`estado`, `categoria`, `metodoPago`): sort lexicographically as strings — same as current behavior for any non-numeric field.
- **date type**: `new Date(value).getTime()` handles both `Date` objects and ISO strings safely.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | useSort hook | Isolate: test default sort, toggle direction, nulls-last, date strings, accessor for computed field |
| Unit | comparator utility | Test each type × null combinations × direction |
| Integration | Each component renders sorted data | Mount with fixture data, click header, verify DOM order |
| Integration | CajaTable sort + pagination | Sort then change page — verify correct page items |

## Migration / Rollout

No migration required. Each component change is additive (adding sort UI to existing data). Server action params are optional (backward compatible). Recommended order: shared infra → CRUD modules (articles, clients, pedidos, usuarios) → report modules (inventory, ventas, domiciliarios, caja).

## Open Questions

- [ ] None — all decisions resolved in proposal + exploration.
