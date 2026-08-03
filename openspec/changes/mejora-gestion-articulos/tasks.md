# Tasks: Mejora Gestión de Artículos

## Review Workload Forecast

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

| Unit | PR | Test cmd | Rollback |
|------|----|----|----|
| 1 — T1–T3 | PR 1 | vitest articulos+ArticleForm | articulos.ts+ArticleForm.tsx |
| 2 — T4–T6 | PR 2 | vitest ArticleFilters+ArticleList | ArticleFilters.tsx+ArticleList.tsx |

## Phase 1: Validation Foundation

- [ ] **T1.1 RED** — `lib/validations/articulos.test.ts`: (a) `{precio,costo}` falla si `precio<=costo`, (b) `{precio}` pasa, (c) `{costo}` pasa, (d) `createArticuloSchema` rechaza. Debe FALLAR.
  - Depends: spec GWT
- [ ] **T1.2 GREEN** — Agregar `.refine()` post `.partial()`: `(d) => d.precio===undefined || d.costo===undefined || d.precio>d.costo`, `path:["precio"]`. `stockActual` ya en `.extend()`.
  - Files: `lib/validations/articulos.ts`
  - Depends: T1.1

## Phase 2: Form — Partial Edit Payload

- [ ] **T2.1 RED** — `ArticleForm.test.tsx`: (a) editar solo `precio` → action recibe `{precio}` solo, (b) editar `nombre` con `costo=2250` → `costo` no viaja, (c) `create` sin `costo` → falla, (d) submit sin cambios → action no llamada, `onSuccess` sí. Mock actions. Debe FALLAR.
  - Depends: T1.2
- [ ] **T2.2 GREEN** — Reescribir `useActionState`: payload desde `useState`, incluir solo campos con `state[field] !== initialData[field]`. Vacío → `onSuccess()` directo. Eliminar hidden inputs de selects.
  - Files: `components/articulos/ArticleForm.tsx`
  - Depends: T2.1

## Phase 3: Form — Stock Adjustment Input

- [ ] **T3.1 RED** — Extender `ArticleForm.test.tsx`: (a) `stockActual` no se renderiza en `create`, (b) visible en edit con valor precargado, (c) `-5` → falla validación, (d) nota "no se registra en el historial" visible. Debe FALLAR.
  - Depends: T2.2
- [ ] **T3.2 GREEN** — `<Input type="number" min={0} step={1}>` para `stockActual` solo `mode==="edit"`, tras Stock Mínimo, con `<p>` de nota. Wireado a `setStockActual`.
  - Files: `components/articulos/ArticleForm.tsx`
  - Depends: T3.1

## Phase 4: Filter State + Stock Helper

- [ ] **T4.1 RED** — Exportar `type StockStatus` y `getStockStatus(a)`. Test: `stockActual=0`→"sin-stock", `<stockMinimo`→"bajo", `>=`→"ok". Debe FALLAR.
  - Files: `components/articulos/ArticleFilters.tsx`
  - Depends: —
- [ ] **T4.2 GREEN** — Implementar `getStockStatus`. Extender `ArticleFiltersState` con `activo?`, `stockStatus?`, `precioMin?`, `precioMax?`.
  - Files: `components/articulos/ArticleFilters.tsx`
  - Depends: T4.1

## Phase 5: Filter Drawer UI

- [ ] **T5.1 RED** — `ArticleFilters.test.tsx`: (a) click "Filtros" abre `Dialog` con cat+pres+activo+stockStatus+2 precios, (b) mobile `self-end w-full max-w-none rounded-t-2xl max-h-[80vh]`, desktop `sm:self-center sm:max-w-md sm:rounded-2xl`, (c) chip "PAPA" + X lo remueve, (d) badge "2" con 2 filtros, (e) "Limpiar todo" → `onChange({})`. Debe FALLAR.
  - Depends: T4.2
- [ ] **T5.2 GREEN** — Search + botón "Filtros" (badge) siempre visibles. Resto en `<Dialog>` responsive. Chips `<Badge>` + X (`lucide-react`) bajo search. "Limpiar todo" → `onChange({})` + reset search.
  - Files: `components/articulos/ArticleFilters.tsx`
  - Depends: T5.1

## Phase 6: Filter Predicates (Client-Side)

- [ ] **T6.1 RED** — `ArticleList.test.tsx`: (a) `activo=true` excluye inactivos, (b) `stockStatus="sin-stock"` solo `stockActual=0`, (c) `precioMin=2000, precioMax=4000` rango correcto, (d) múltiples filtros operan AND. Mock `getArticulosAction`. Debe FALLAR.
  - Depends: T4.2
- [ ] **T6.2 GREEN** — Extender `filtered` con predicados `activo`, `stockStatus` (usar `getStockStatus`), `precioMin`, `precioMax`. Sort accessor "estado" → `getStockStatus`.
  - Files: `components/articulos/ArticleList.tsx`
  - Depends: T6.1

## Phase 7: Final Verification

- [ ] **T7.1** — `npm run test` + `npm run lint` + `npm run build` limpios. Aria-labels del drawer revisados.
  - Depends: T6.2
