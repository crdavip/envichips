# Tasks: Arreglar Flujo de Pedidos

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,200 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 |
| Delivery strategy | force-chained |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Schema + auth fix | PR 1 → main | Base for all follow-up PRs (Schema, Services, Actions) |
| 2 | DOMICILIARIO dashboard | PR 2 → main | Depends on PR 1 auth fixes (Dashboard, Listado, TomarButton) |
| 3 | Payment-method-aware cobro | PR 3 → main | Depends on PR 1 EstadoCobro (Modal, Badges, Service logic) |
| 4 | Stock validation + polish | PR 4 → main | Depends on PR 3 entregar modal |


## Phase 1 — Schema + Auth Fix (PR 1, ~380 lines)

- [x] 1.1 Add `EstadoCobro` enum + `estadoCobro` field to `prisma/schema.prisma`; run generate
- [x] 1.2 Fix `createPedido` in `lib/services/pedidos.ts`: always PENDIENTE, remove stock decrement
- [x] 1.3 Fix `actualizarEstado` in `lib/services/pedidos.ts`: role-aware, `cambiadoPor`, PENDIENTE→ENTREGADO
- [x] 1.4 New `tomarPedido` service in `lib/services/pedidos.ts`: atomic conditional WHERE
- [x] 1.5 Fix `updateEstadoAction` in `app/(dashboard)/pedidos/actions.ts`: remove ADMIN-only guard
- [x] 1.6 New `tomarPedidoAction` in `app/(dashboard)/pedidos/actions.ts`
- [x] 1.7 Fix `confirmarCobroAdmin` in `lib/services/pedidos.ts`: add HistorialEstado entry
- [x] 1.8 Update schemas in `lib/validations/pedidos.ts` for EstadoCobro

## Phase 2 — DOMICILIARIO Dashboard + Listado (PR 2, ~350 lines)

- [x] 2.1 New `getResumenDomiciliario` service in `lib/services/informes.ts`
- [x] 2.2 Fix `getPedidos` in `lib/services/pedidos.ts`: available + own orders, no today filter
- [x] 2.3 DOMICILIARIO dashboard in `app/(dashboard)/page.tsx`: role-based cards
- [x] 2.4 PedidoList in `components/pedidos/PedidoList.tsx`: tabs for Disponibles/Mis pedidos
- [x] 2.5 New `TomarPedidoButton` in `components/pedidos/TomarPedidoButton.tsx`

## Phase 3 — Payment-Method-Aware Cobro (PR 3, ~320 lines)

- [x] 3.1 `actualizarEstado` ENTREGADO: set `estadoCobro` per `metodoPago` in `lib/services/pedidos.ts`
- [x] 3.2 `PedidoDetail` EstadoCobro section: badges per spec in `components/pedidos/PedidoDetail.tsx`
- [x] 3.3 Entregar modal: FIADO no cobro, EFECTIVO current, TRANSFERENCIA simplified prompt

## Phase 4 — Stock Validation + Polish (PR 4, ~150 lines)

- [x] 4.1 Stock validation in `actualizarEstado` before ENTREGADO in `lib/services/pedidos.ts`
- [x] 4.2 Error display in `PedidoDetail`: stock error banner, disable button with tooltip
