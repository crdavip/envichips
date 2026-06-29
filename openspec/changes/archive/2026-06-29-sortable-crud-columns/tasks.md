# Tasks: Sortable CRUD Columns

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 800–1200+ |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | force-chained |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Shared infra (hook, SortBar, server contracts) | PR 1 → main | Tests for useSort included; ~250–350 lines |
| 2 | CRUD modules (Article, Cliente, Pedido, Usuarios) | PR 2 → main | Depends on PR 1; ~300–400 lines |
| 3 | Report modules (Inventario, Ventas, Domiciliarios, Caja) | PR 3 → main | Depends on PR 1; ~250–300 lines |

## Phase 1: Shared Infrastructure

- [x] 1.1 Create `lib/hooks/useSort.ts` — config API, type dispatch, nulls-last, accessors for computed fields
- [x] 1.2 Create `components/ui/sort-controls.tsx` — SortBar dropdown using SelectRoot for mobile cards
- [x] 1.3 Add optional `sortBy`/`sortOrder` params to 4 server actions (articulos, clientes, pedidos, usuarios)
- [x] 1.4 Add optional `sortBy`/`sortOrder` params to `lib/services/informes.ts` (getVentas, getInventario, getDomiciliarios)
- [x] 1.5 Unit tests: useSort default sort, toggle direction, nulls-last, date strings, accessor for ganancia

## Phase 2: CRUD Modules

- [x] 2.1 Modify `ArticleList.tsx` — replace inline sort with useSort, 9 sortable columns, SortBar in card grid
- [x] 2.2 Modify `ClienteList.tsx` — replace inline sort with useSort, 6 sortable columns, SortBar
- [x] 2.3 Modify `PedidoList.tsx` — replace hardcoded fecha-desc with useSort unified across 3 layout variants, SortBar
- [x] 2.4 Modify `UsuariosTable.tsx` — add useSort with all 7 columns, SortBar above mobile cards

## Phase 3: Report Modules

- [x] 3.1 Modify `InventarioTable.tsx` — add `estado` sort, replace inline sort with useSort, SortBar
- [x] 3.2 Modify `VentasTable.tsx` — add `nombre` sort, replace inline sort with useSort, SortBar
- [x] 3.3 Modify `DomiciliariosTable.tsx` — add `nombre` sort, replace inline sort with useSort, SortBar
- [x] 3.4 Modify `CajaTable.tsx` — add useSort for all 6 columns, sort BEFORE pagination slice, SortBar

## Phase 4: Verification

- [ ] 4.1 Integration: each component renders correctly sorted data on header click
- [ ] 4.2 Verify CajaTable: sort then paginate — correct items per page
- [ ] 4.3 Verify PedidoList: sort state shared across all 3 layout variants
- [ ] 4.4 Verify nulls-last on cliente telefono, ultimaVisita, usuario telefono, ultimoAcceso
- [ ] 4.5 Verify ganancia computed sort in ArticleList (precio - costo)
