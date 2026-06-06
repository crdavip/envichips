# Archive Report: improve-order-wizard

## Change Summary

Redesigned the order creation wizard to support browse + search mode. Users now see a list of clients/products immediately upon landing on each step, instead of being forced to type a search query first.

## Files Changed

| File | Change | Status |
|------|--------|--------|
| `app/(dashboard)/pedidos/actions.ts` | Removed 2-char minimum guard; returns first 20 results on empty query | ✅ Applied |
| `components/pedidos/PedidoForm.tsx` | Rewrote Step 1 & 2: browse + search UX, venta rápida toggle fix, collapsible cart, mobile grid layout | ✅ Applied |

## What Was Fixed

1. **Browse impossibility** (CRITICAL): Both client and product screens now load initial data on mount. User can browse all options or type to filter.
2. **Venta rápida toggle**: Now preserves `clienteNombre` across mode switches. Only explicit unselect or new client selection clears the name.
3. **Mobile UX**: 2-column product grid, larger touch targets (52px min for list items, 40px inputs), collapsible cart.

## What Was Preserved

- All form fields, validation, and submission logic
- URL-based step navigation
- Step 3 (Resumen) completely unchanged
- All server action return types

## Artifacts

- `openspec/changes/improve-order-wizard/exploration.md`
- `openspec/changes/improve-order-wizard/proposal.md`
- `openspec/changes/improve-order-wizard/spec.md`
- `openspec/changes/improve-order-wizard/design.md`
- `openspec/changes/improve-order-wizard/tasks.md`
- `openspec/changes/improve-order-wizard/verify-report.md`
