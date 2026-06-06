# Tasks: improve-order-wizard

## Review Workload Forecast

- **Estimated changed lines**: ~350 (50 in actions.ts, ~300 in PedidoForm.tsx)
- **400-line budget risk**: LOW (under 400 lines)
- **Chained PRs recommended**: No (within single PR budget)
- **Decision needed before apply**: No

## Tasks

### T1: Modify server actions for browse mode
**File**: `app/(dashboard)/pedidos/actions.ts`
**Change**: Remove 2-char minimum guard from `getClientesAction` and `getArticulosForPedidoAction`. When query is empty, return first 20 items ordered by name. When query is present, filter by name.
**Lines changed**: ~30
**Risk**: Low — pure additive change, existing behavior preserved

### T2: Refactor Step 1 — Client browse + search + Venta rápida fix
**File**: `components/pedidos/PedidoForm.tsx`
**Change**:
- On mount, call `getClientesAction("")` to load initial list
- Show search input + scrollable client list
- Fix venta rápida toggle: preserve `clienteNombre` across mode switches, only clear on explicit action
- Improve mobile touch targets (minimum 44px)
**Lines changed**: ~100 (replacement of current Step 1 section)
**Risk**: Medium — must ensure venta rápida still works end-to-end

### T3: Refactor Step 2 — Product browse + search + cart layout
**File**: `components/pedidos/PedidoForm.tsx`
**Change**:
- On mount, call `getArticulosForPedidoAction("")` to load initial list
- Show search input + product grid (2-col on mobile, 3-col on tablet)
- Cart section with collapsible header showing item count
- Larger touch targets for "Agregar" buttons
**Lines changed**: ~150 (replacement of current Step 2 section)
**Risk**: Medium — cart behavior must be preserved

### T4: Verify all scenarios
**Manual test**:
- Browse + search clients works
- Browse + search products works
- Venta rápida toggle preserves name across mode switches
- Create order with client selected → success
- Create order with venta rápida → success
- Step 3 validation and submission unchanged
**Lines changed**: 0
**Risk**: Low

## Task Dependencies

```
T1 (actions) ──► T2 (step 1) ──► T3 (step 2) ──► T4 (verify)
                      └──► T3 (step 2 depends on T1 too)
```

T1 must be done first (enables browse). T2 and T3 can technically be done in either order but T2 → T3 follows the wizard flow. T4 is last.
