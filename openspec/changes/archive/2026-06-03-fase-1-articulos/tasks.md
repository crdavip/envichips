# Tasks: Fase 1 — Artículos

> Envichips SaaS · SDD Tasks
> Basado en proposal.md + specs.md + design.md

---

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1500–1700 (mostly new files) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Delivery strategy | ask-always |
| Chain strategy | pending |
| Suggested split | 4 chained PRs (feature-branch-chain recommended) |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| W1 | Foundation: data + validation layer | PR 1 | base: `feature/fase-1-articulos` (tracker); types, Zod, Prisma service |
| W2 | Server Actions + atomic UI primitives | PR 2 | base: PR 1 branch; actions.ts, StockBadge, Filters, Card+Row |
| W3 | Composite client components | PR 3 | base: PR 2 branch; ArticleForm, PurchaseModal, ArticleList |
| W4 | Pages + seed | PR 4 | base: PR 3 branch; list page, history page, seed update — merges to main |

---

## Layer 1: Foundation (no deps)

### F1.1 — Zod validation schemas + TypeScript types
- **Files**: create `lib/validations/articulos.ts`, create `types/articulos.ts`
- **Deps**: —
- **Effort**: 0.5h
- **Done when**:
  - [x] `articuloSchema`, `createArticuloSchema`, `updateArticuloSchema`, `registerPurchaseSchema` exported
  - [x] `Categoria` and `Presentacion` enums match Prisma exactly
  - [x] `precio > costo` enforced via `.refine()` with Spanish error message
  - [x] COP fields use `z.number().int().positive()`; `stockMinimo >= 0`
  - [x] Output types via `z.infer<typeof schema>` exported in `types/articulos.ts`

### F1.2 — Prisma service layer
- **Files**: create `lib/services/articulos.ts`
- **Deps**: —
- **Effort**: 1h
- **Done when**:
  - [x] `getArticulos({ categoria?, presentacion?, q?, activo? })` → `Articulo[]`
  - [x] `getArticuloById(id)` → `Articulo | null`
  - [x] `createArticulo(data)` / `updateArticulo(id, data)` / `setArticuloActivo(id, activo)` exported
  - [x] `getHistorialArticulo(id)` returns `{ fecha, tipo, cantidad, referencia, responsable }[]` merged from `CompraItem` + `PedidoItem` (only `ENTREGADO`), sorted desc
  - [x] Service uses `prisma` from `lib/db.ts`; no business validation here (Zod handles it)

---

## Layer 2: Server Actions (deps: F1.1, F1.2)

### F1.3 — Server Actions for articles module
- **Files**: create `app/(dashboard)/articulos/actions.ts`
- **Deps**: F1.1, F1.2
- **Effort**: 1.5h
- **Done when**:
  - [ ] All actions start with `"use server"` directive
  - [ ] `getArticulosAction`, `getArticuloByIdAction`, `createArticuloAction`, `updateArticuloAction`, `deleteArticuloAction` (soft delete), `registerPurchaseAction`, `getHistorialArticuloAction` exported
  - [ ] Every action returns `{ data?: T } | { error: string }` consistently
  - [ ] Each action validates input with Zod (`safeParse`) before touching Prisma
  - [ ] `registerPurchaseAction` uses `prisma.$transaction` for `Compra.create` + `CompraItem.createMany` + `Articulo.updateMany` with `stockActual: { increment: cantidad }` per item
  - [ ] `revalidatePath("/dashboard/articulos")` called after mutating actions

---

## Layer 3: Atomic UI Components (deps: F1.1)

### F1.4 — StockBadge component
- **Files**: create `components/articulos/StockBadge.tsx`
- **Deps**: F1.1 (types)
- **Effort**: 0.5h
- **Done when**:
  - [ ] Pure presentational component, props: `{ stockActual: number; stockMinimo: number }`
  - [ ] Renders "Stock OK" (green) when `stockActual >= stockMinimo`
  - [ ] Renders "Stock Bajo" (yellow) when `0 < stockActual < stockMinimo`
  - [ ] Renders "Sin Stock" (red) when `stockActual === 0`
  - [ ] Uses shadcn `Badge` with Tailwind color classes; no client state needed

### F1.5 — ArticleFilters component
- **Files**: create `components/articulos/ArticleFilters.tsx`
- **Deps**: F1.1 (types)
- **Effort**: 0.5h
- **Done when**:
  - [ ] Client component (`"use client"`) with two Selects (Categoría, Presentación) + search Input
  - [ ] "Todos" option in both selects as default
  - [ ] Search input uses 300ms debounce (`useEffect` + `setTimeout`)
  - [ ] Receives `value` and `onChange` callback props (controlled) — does not own filter state
  - [ ] Renders category/presentation labels in Spanish

### F1.6 — ArticleCard + ArticleRow
- **Files**: create `components/articulos/ArticleCard.tsx`, `components/articulos/ArticleRow.tsx`
- **Deps**: F1.1, F1.4
- **Effort**: 1h
- **Done when**:
  - [ ] `ArticleCard`: mobile card with nombre, categoría, presentación, precio (COP formatted), ganancia, `StockBadge`; whole card clickable
  - [ ] `ArticleRow`: shadcn `TableRow` with columns: nombre, categoría, presentación, costo, precio, ganancia, stock, `StockBadge`, actions (Editar pencil, toggle activo)
  - [ ] Both components show `activo === false` items with `opacity-50` + "Inactivo" label
  - [ ] Actions emit callbacks (not server actions directly) — parent owns mutations
  - [ ] Use `lib/format.ts` (or inline `Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })`) for COP

---

## Layer 4: Composite Components (deps: F1.3, F1.4, F1.5, F1.6)

### F1.7 — ArticleForm component
- **Files**: create `components/articulos/ArticleForm.tsx`
- **Deps**: F1.1, F1.3
- **Effort**: 1.5h
- **Done when**:
  - [ ] Client component with `"use client"`; uses React 19 `useActionState`
  - [ ] Fields: nombre (Input), categoría (Select), presentación (Select), costo (Input number), precio (Input number), stockMinimo (Input number)
  - [ ] Read-only `ganancia` field, auto-computed as `precio - costo`, updates on precio/costo change
  - [ ] Client-side Zod validation on submit; shows inline field errors
  - [ ] Supports `mode="create" | "edit"` prop; edit mode prefills from `initialData`
  - [ ] Calls `createArticuloAction` or `updateArticuloAction`; on success `router.push("/dashboard/articulos")`; on error keeps form data
  - [ ] Optional "Desactivar" button in edit mode (only when `activo === true`) calls `deleteArticuloAction` after `confirm()`

### F1.8 — PurchaseModal (2-step wizard)
- **Files**: create `components/articulos/PurchaseModal.tsx`, `components/articulos/PurchaseStepOne.tsx`, `components/articulos/PurchaseStepTwo.tsx`
- **Deps**: F1.1, F1.3, F1.4
- **Effort**: 2h
- **Done when**:
  - [ ] shadcn `Dialog` (full-screen on mobile via `sm:max-w-*`); trigger prop or controlled `open`
  - [ ] Internal `step` state (`1 | 2`); "Siguiente" disabled when step 1 has no items with `cantidad > 0`
  - [ ] Step 1: search input (300ms debounce) + list of articles with `+ Agregar` button and quantity number input per item; shows running list of selected items
  - [ ] Step 2: items summary table (nombre, cantidad, costo unitario, subtotal), total, fecha (default hoy), proveedor (required), metodoPago (EFECTIVO/TRANSFERENCIA select), observaciones textarea, Confirmar / Volver buttons
  - [ ] Confirmar calls `registerPurchaseAction`; on success closes modal + `router.refresh()`; on error shows message in step 2
  - [ ] Cancelar closes modal without saving; resets internal state

### F1.9 — ArticleList (client list orchestrator)
- **Files**: create `components/articulos/ArticleList.tsx`
- **Deps**: F1.3, F1.4, F1.5, F1.6, F1.7, F1.8
- **Effort**: 1.5h
- **Done when**:
  - [ ] Client component; initial data fetched via `getArticulosAction()` on mount (`useEffect`)
  - [ ] Local state: `articulos`, `filtros` (categoria, presentacion, q), `loading`, `error`
  - [ ] Filters/search are client-side over the loaded array (case-insensitive `includes` on `nombre`)
  - [ ] Auto-switches between grid (`<768px`) and table (`≥768px`) via Tailwind responsive classes; no manual toggle
  - [ ] Header: title "Artículos", `Button` "Nuevo Artículo" (opens `ArticleForm` in create mode), `Button` "+ Compra" (opens `PurchaseModal`)
  - [ ] Loading state shows shadcn `Skeleton`; error state shows inline error message
  - [ ] "Editar" and "Activar/Desactivar" actions wired to F1.3 actions with `confirm()` for delete

---

## Layer 5: Pages (deps: Layer 4)

### F1.10 — Article list page
- **Files**: create `app/(dashboard)/articulos/page.tsx`
- **Deps**: F1.9
- **Effort**: 0.5h
- **Done when**:
  - [ ] Server component; minimal shell (heading, description) + renders `<ArticleList />` client component
  - [ ] Uses `auth()` from NextAuth to guard route (redirect to login if no session)
  - [ ] Page metadata via `export const metadata: Metadata`

### F1.11 — Inventory history page
- **Files**: create `app/(dashboard)/articulos/[id]/historial/page.tsx`
- **Deps**: F1.3
- **Effort**: 1h
- **Done when**:
  - [ ] Server component; receives `params.id`; calls `getArticuloByIdAction` (404 redirect if not found)
  - [ ] Calls `getHistorialArticuloAction` server-side for movements
  - [ ] Header: article name + current `stockActual` as large number
  - [ ] Timeline: vertical list with left border + colored dot per movement (green = entrada, red = salida)
  - [ ] Each item shows fecha (formatted es-CO), tipo badge, cantidad, referencia (Compra # or Pedido #), responsable
  - [ ] Empty state: "Sin movimientos registrados"
  - [ ] Back link to `/dashboard/articulos`

---

## Layer 6: Seed / Integration

### F1.12 — Update seed with sample articles
- **Files**: modify `prisma/seed.ts`
- **Deps**: F1.2
- **Effort**: 0.5h
- **Done when**:
  - [ ] Seed inserts 10–15 sample articles covering all `Categoria` and `Presentacion` enum values
  - [ ] Realistic COP values (costo 1500–3000, precio 2000–4500, stockMinimo 5–20)
  - [ ] Idempotent (uses `upsert` keyed by a stable slug field, or wraps in try/catch since no unique besides id)
  - [ ] At least 1–2 articles with `activo: false` to exercise the inactive UI

---

## Dependency Graph (summary)

```
F1.1 ─┬─→ F1.3 ─┬─→ F1.7 ─┐
F1.2 ─┘        │          │
F1.1 ─→ F1.4 ─┤          ├─→ F1.10 (list page)
F1.1 ─→ F1.5 ─┤          │
F1.4, F1.5 ─→ F1.6 ─┐    │
F1.3, F1.4 ──────→ F1.8 │
F1.3, F1.6 ──────→ F1.9 ┘
F1.3 ──→ F1.11 (history page)
F1.2 ──→ F1.12 (seed)
```

---

## Implementation Order

1. **W1 (PR 1)**: F1.1 + F1.2 in parallel — both have no deps; merge first to unblock everything
2. **W2 (PR 2)**: F1.3 first, then F1.4 / F1.5 / F1.6 in parallel — server actions + atomic UI primitives
3. **W3 (PR 3)**: F1.7, F1.8, F1.9 — composite client components, can be done in any order but all must land together
4. **W4 (PR 4)**: F1.10, F1.11, F1.12 — pages wire everything up; seed makes local demo work end-to-end
