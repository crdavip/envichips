# Verify Report: Fase 1 — Artículos

> Envichips SaaS · Verificación SDD
> Build: `npx tsc --noEmit` — **clean** (zero errors)
> Date: 2026-06-03

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 2 |
| WARNING  | 4 |
| SUGGESTION | 7 |
| Build    | PASS  |

**Status**: **fail** (2 CRITICAL items require fixes before archive)

---

## CRITICAL (must fix)

### C1. `registerPurchase` hardcodes `registradaPorId: "system"` with TODO
- **File**: `lib/services/articulos.ts:112`
- **Spec**: §5 — `registerPurchase(data)` MUST crear Compra con sus CompraItem en una transacción + §3 — Compra must reference the user who registered it
- **Issue**: The service passes `registradaPorId: "system"` with a `// TODO: replace with actual user ID from session` comment. The `Compra` model has `registradaPorId String` as non-nullable, so any FK constraint to a `User` will fail (no User with id `"system"`). Even without a FK constraint, all purchases will be incorrectly attributed to a non-existent user. This is a functional bug, not a refactor.
- **Evidence**: `lib/services/articulos.ts:103-122` — the `tx.compra.create({ data: { ..., registradaPorId: "system", ... } })`
- **Fix required**: Inject session user via `auth()` from NextAuth in the action, pass to the service, write the actual user id to `registradaPorId`.

### C2. `fecha` field in `registerPurchaseSchema` is accepted but never written
- **File**: `lib/services/articulos.ts:102-135` and `lib/validations/articulos.ts:62`
- **Spec**: §3 — "fecha (default hoy)" — MUST be settable by the user
- **Issue**: The Zod schema defines `fecha: z.string().datetime().optional()` and the modal sends `fecha: new Date(fecha).toISOString()` to the server action, but the service ignores it entirely. The `Compra` model relies on `fecha DateTime @default(now())`, so a user-edited fecha in the UI is silently discarded. This is a data-integrity bug: spec acceptance test "Compra simple" + the "fecha (default hoy, editable)" requirement cannot be met as written.
- **Evidence**: `lib/services/articulos.ts:106-111` — `tx.compra.create({ data: { proveedor, metodoPago, total, observaciones, registradaPorId, items } })` — no `fecha` field passed.
- **Fix required**: In the service, accept `fecha` from input (coerced to `Date`) and pass it as `fecha: data.fecha ? new Date(data.fecha) : undefined` to the create payload (Prisma treats `undefined` as "use default").

---

## WARNING (spec gaps / missing error handling)

### W1. Spec criterion "redirect to listado on save" not met (ArticleForm)
- **File**: `components/articulos/ArticleForm.tsx:108-111, 127-131`
- **Spec**: §2 — "Al guardar exitosamente, MUST redirigir al listado de artículos"
- **Issue**: On success the form calls `onSuccess` (which closes the modal and refetches), but does NOT call `router.push("/dashboard/articulos")`. The design.md section 4.2 step 11 explicitly says "If success → redirect to /dashboard/articulos".
- **Why flagged**: Dialog overlay stays open conceptually is fine UX, but the spec is explicit. Either update spec/design to "close modal + refetch" or add a `router.push` after success.

### W2. Stock badges miss the "OR equal" case at the boundary
- **File**: `components/articulos/StockBadge.tsx:9-15`
- **Spec**: §1 — `stockActual >= stockMinimo` → "Stock OK"
- **Issue**: Implementation is correct (`stockActual < stockMinimo` → "Stock Bajo"). **Not a bug**, but a defensive note: with `stockMinimo = 0`, a stock of 0 would fall through to "Sin Stock" first (good). With `stockMinimo = 0` and `stockActual = 0`, the order of conditions is correct. Pass.

### W3. Table column sorting not implemented
- **File**: `components/articulos/ArticleList.tsx:257-282` and `components/articulos/ArticleRow.tsx`
- **Spec**: §1 — "SHOULD tener ordenamiento por nombre, precio y stock (click en encabezados de tabla)"
- **Issue**: `TableHead` elements are static. No `onClick` sort handler. Service layer supports `sortBy`/`sortOrder` (lines 20-22 of service), but the UI never wires it. "SHOULD" criteria are not hard requirements, but tasks.md F1.9 does not list sort as out-of-scope.

### W4. Historial page missing "stock resultante" per movement
- **File**: `app/dashboard/articulos/[id]/historial/page.tsx:84-132`
- **Spec**: §4 — "SHOULD mostrar el stock resultante después de cada movimiento"
- **Issue**: The service returns movements with no `stockResultante` field; the page does not compute or display it. The data model in `types/articulos.ts:17-25` declares `stockResultante?: number` on `MovementEntry` (dead type). Walking forward from current stock minus the deltas would be straightforward, but it isn't done.

---

## SUGGESTION (improvements, style, best practices)

### S1. Spec lists `articuloSchema`, code uses `createArticuloSchema`
- **Files**: `lib/validations/articulos.ts`
- Spec §6 + tasks.md F1.1 both reference `articuloSchema` as a standalone export. Implementation exports `createArticuloSchema` and `updateArticuloSchema` (= partial of create). The naming is fine in practice, but a rename or a base export keeps the docs aligned.

### S2. `MetodoPagoEnum` includes `FIADO` but UI only offers EFECTIVO/TRANSFERENCIA
- **Files**: `lib/validations/articulos.ts:26-30`, `components/articulos/PurchaseModal.tsx:387-389`
- Spec §3 explicitly lists "EFECTIVO / TRANSFERENCIA" for purchases, so omitting FIADO from the UI is correct. The Zod schema allowing it is harmless (no path to set it from the form), but tightening the schema to match the UI's `MetodoPago = "EFECTIVO" | "TRANSFERENCIA"` would prevent future drift.

### S3. `useEffect` in `ArticleForm` calls `onSuccess` on every render where `formState.success === true`
- **File**: `components/articulos/ArticleForm.tsx:127-131`
- If `onSuccess` is unstable (closure over changing parent state), it could fire multiple times. Today the parent passes `handleFormSuccess` which is not memoized. Low risk in practice since `success` only flips once per submission, but wrapping the parent callback in `useCallback` (or having the form use `useRef` for the success flag) is the defensive pattern.

### S4. `CompraWithItems` and `MovementEntry` types in `types/articulos.ts` are unused
- **File**: `types/articulos.ts:7-25`
- The page receives `MovimientoHistorial` from `actions.ts`, not `MovementEntry`. `ArticuloWithRelations` and `CompraWithItems` are declared but never imported. Dead types add maintenance cost.

### S5. `ArticleCard` is clickable but the toggle button inside has no `aria-label`
- **File**: `components/articulos/ArticleCard.tsx:72-82`
- Accessibility nit: the inner `<button>` says "Desactivar" / "Activar" with no `aria-label` distinguishing the article. The label-only approach is fine because the article name is on the same card, but a screen reader will read "Desactivar, button" without context. A label like `aria-label="Desactivar ${articulo.nombre}"` improves clarity.

### S6. `ArticleFilters` debounce cleanup is correct but `useEffect` dependency array is empty
- **File**: `components/articulos/ArticleFilters.tsx:65-69`
- The cleanup uses an empty dependency array. The dep array is technically correct (the timer is a singleton), but the linter may warn. Adding `[]` to the dep array is what's there — flagged only for awareness; the implementation is correct.

### S7. `historial/page.tsx` date formatter uses es-CO with toLocaleDateString — server-side
- **File**: `app/dashboard/articulos/[id]/historial/page.tsx:101-106`
- This is a Server Component, so `toLocaleDateString("es-CO", …)` runs on the server. Locale data on Node must be available; in some Docker deployments the full-icu build is required. Consider pre-rendering with `format: "long"` literals in Spanish (e.g., `new Intl.DateTimeFormat("es-CO", { … }).format(fecha)`) or just hand-formatting. Low priority.

---

## Spec ↔ Implementation matrix

| Spec section | Status | Notes |
|--------------|--------|-------|
| §1 Catálogo — ruta `/dashboard/articulos` | PASS | `app/dashboard/articulos/page.tsx` |
| §1 — grid mobile + table desktop | PASS | `ArticleList.tsx:244, 256` — `lg:hidden` / `hidden lg:block` |
| §1 — tarjeta con nombre, precio, ganancia, stock, badge | PASS | `ArticleCard.tsx` |
| §1 — columnas tabla | PASS | `ArticleRow.tsx` |
| §1 — filtros categoría + presentación | PASS | `ArticleFilters.tsx` |
| §1 — búsqueda con debounce 300ms | PASS | `ArticleFilters.tsx:58` |
| §1 — client-side filtering | PASS | `ArticleList.tsx:81-90` |
| §1 — inactivos con opacity-50 | PASS | `ArticleCard.tsx:26`, `ArticleRow.tsx:28` |
| §1 — badge stock OK/Bajo/Sin Stock | PASS | `StockBadge.tsx` |
| §1 — acciones editar + toggle | PASS | `ArticleRow.tsx:62-86`, `ArticleCard.tsx:72-82` |
| §1 — sort por nombre default | PASS | service `orderBy.nombre = "asc"` |
| §1 — SHOULD sort por columnas (click headers) | **GAP** | See W3 |
| §1 — MAY paginación >100 | N/A | not yet needed |
| §2 — form fields | PASS | `ArticleForm.tsx` |
| §2 — ganancia read-only | PASS | `ArticleForm.tsx:257-265` |
| §2 — precio > costo validación cliente + server | PASS | Zod refine, client + server |
| §2 — useActionState | PASS | `ArticleForm.tsx:86` |
| §2 — soft delete con confirm | PASS | `ArticleForm.tsx:134-144` |
| §2 — server error preserva form data | PASS | controlled state preserved |
| §2 — redirect on save | **GAP** | See W1 |
| §3 — 2-step modal | PASS | `PurchaseModal.tsx` |
| §3 — step 1: search + select + qty | PASS | `PurchaseModal.tsx:204-323` |
| §3 — step 2: summary, total, proveedor, metodoPago | PASS | `PurchaseModal.tsx:327-432` |
| §3 — atomic transaction | PASS | `services/articulos.ts:102-135` |
| §3 — cancelar sin guardar | PASS | `resetState` + `onOpenChange(false)` |
| §3 — fecha editable | **FAIL** | See C2 — fecha is ignored by service |
| §3 — usuario que registra | **FAIL** | See C1 — hardcoded `"system"` |
| §4 — server component | PASS | `app/dashboard/articulos/[id]/historial/page.tsx` |
| §4 — timeline green/red | PASS | lines 88-115 |
| §4 — combined CompraItem + PedidoItem (ENTREGADO) | PASS | `services/articulos.ts:139-185` |
| §4 — empty state | PASS | lines 73-80 |
| §4 — back link | PASS | lines 52-57 |
| §4 — SHOULD stock resultante | **GAP** | See W4 |
| §4 — SHOULD link a compra/pedido | **GAP** | text only, no `Link` |
| §5 — 8 actions | PASS | 8 actions exported (spec lists 7, plus `reactivateArticuloAction` is an addition) |
| §5 — return `{ data? } \| { error }` | PASS | all actions |
| §5 — Zod validation before Prisma | PASS | `safeParse` then Prisma |
| §5 — revalidatePath | PASS | after each mutation |
| §5 — purchase transaction | PASS | `db.$transaction` |
| §5 — `"use server"` directive | PASS | `actions.ts:1` |
| §6 — schemas | PASS | `createArticuloSchema`, `updateArticuloSchema`, `purchaseItemSchema`, `registerPurchaseSchema` |
| §6 — `articuloSchema` standalone | **MINOR** | See S1 |
| §6 — precio > costo via `.refine()` | PASS | `validations/articulos.ts:47-50` |
| §6 — output types | PASS | `z.output<>` exports |
| §6 — enums match Prisma | PASS | Categoria, Presentacion, MetodoPago |
| §6 — COP `int().positive()` | PASS | `costo`, `precio` |
| Non-functional — COP format | PASS | `formatCOP` and inline `Intl.NumberFormat("es-CO", { currency: "COP", maximumFractionDigits: 0 })` |
| Non-functional — debounce 300ms | PASS | both in ArticleFilters and PurchaseModal |
| Non-functional — atomic stock updates | PASS | `increment` inside `$transaction` |
| Non-functional — responsive grid/table | PASS | `lg:` breakpoint switch |
| Non-functional — error handling `{ error } \| { data }` | PASS | consistent |

---

## Build

```
$ npx tsc --noEmit
(no output — clean)
```

TypeScript strict mode passes with zero errors across all implementation files, the page, the service layer, the actions, the validations, the components, and the seed.

---

## Recommended next steps

1. **Fix C1 (CRITICAL)**: Wire NextAuth session into `registerPurchaseAction` and pass the real user id down to the service. Remove the `"system"` placeholder.
2. **Fix C2 (CRITICAL)**: Pass the `fecha` from `registerPurchaseSchema` to the Prisma create payload.
3. **Re-judge C1/C2** with the build after fixes, then re-run `npx tsc --noEmit`.
4. Optional polish: W3 (column sort), W4 (stockResultante), W1 (router.push on save) — these are spec gaps but not blockers for archive.
5. Suggestions (S1–S7) are nice-to-haves; archive can proceed without addressing them if scope is locked.

---

## Verdict

**status: fail** | **next: fixes-required**

Two CRITICAL items (C1, C2) must be resolved before this change is archive-ready. The remaining WARNINGs and SUGGESTIONs are spec-level polish that can be addressed in a follow-up or in Fase 2.
