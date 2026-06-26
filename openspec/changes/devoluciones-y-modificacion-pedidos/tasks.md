# Tasks: Devoluciones y Modificación de Pedidos — Modificación

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~440 (5 files) |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (backend) → PR 2 (frontend) → PR 3 (spec) |
| Delivery strategy | force-chained |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Lines | Notes |
|------|------|-----------|-------|-------|
| 1 | Backend: validation + service + action | PR 1 | ~160 | Merges to main; independent |
| 2 | Frontend: edit modal in PedidoDetail.tsx | PR 2 | ~200 | Merges to main; depends on PR 1 |
| 3 | Spec update: openspec/specs/pedidos/spec.md | PR 3 | ~80 | Merges to main; independent |

## Phase 1: Backend — Validation Schema

- [x] F1.1 Add `modificarPedidoSchema` in `lib/validations/pedidos.ts`: items array (articuloId + cantidad positive int, min 1) + motivo (1-500 chars required) — per spec R9
- [x] F1.2 Export `ModificarPedidoInput` type

## Phase 2: Backend — Service (lib/services/pedidos.ts)

- [x] F2.1 Add `modificarPedido(id, data, user)` with state validation (PENDIENTE/EN_CAMINO only) + role check (ADMIN/SUPERADMIN) — per spec R1, R2
- [x] F2.2 Implement item diff: identify added/updated/removed items from current vs requested state — per spec R3
- [x] F2.3 Add stock sufficiency check for ALL final items — per spec R5
- [x] F2.4 Add FIADO re-validation via `validateFiadoDebt` when total changes — per spec R6
- [x] F2.5 Build Prisma `$transaction`: delete removed → update qty → create new items with current precio/costo snapshots → recalc totals → update Pedido → create HistorialEstado with descriptive motivo — per spec R4, R7, R8

## Phase 3: Backend — Server Action

- [x] F3.1 Add `modificarPedidoAction(id, raw)` in `app/(dashboard)/pedidos/actions.ts`: session → requireRole(["ADMIN","SUPERADMIN"]) → safeParse → service → revalidatePath — per spec R10
- [x] F3.2 Return `{ error }` on failure / `{ data }` on success following existing pattern

## Phase 4: Frontend — UI (PedidoDetail.tsx)

- [x] F4.1 Add "Modificar pedido" button visible only for ADMIN/SUPERADMIN on PENDIENTE/EN_CAMINO orders — per spec R1, R2
- [x] F4.2 Build edit modal: current items with qty +/- buttons + manual input; "Agregar producto" with article search (`getArticulosForPedidoAction`); remove button per row with confirmation dialog
- [x] F4.3 Add motivo text field (required), Save/Cancel buttons, loading state, error display, success refresh

## Phase 5: Update Spec

- [x] F5.1 Apply delta: add Section 4.1 to `openspec/specs/pedidos/spec.md` — modification rules, item operations, allowed states, audit requirements, atomicity
- [x] F5.2 Add test scenarios from delta spec: edit qty, add item, remove item, stock validation, FIADO re-validation, role gating, ENTREGADO blocked
