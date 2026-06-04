# Tasks: Fase 4 - Gestión de Clientes

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~650-850 |
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
| 1 | Schema + validation + service layer | PR 1 → main | Tests included |
| 2 | Server actions + list page + ClienteList | PR 2 → main | Depends on PR 1 |
| 3 | Form + detail + abono modal UI | PR 3 → main | Depends on PR 2 |
| 4 | Pedidos debt validation integration | PR 4 → main | Depends on PR 3 |

## Phase 1: Schema + Service Foundation

- [x] F1.1 Remove `deuda` field from `prisma/schema.prisma` (Cliente model)
- [x] F1.2 Create `lib/validations/clientes.ts` with createClienteSchema, updateClienteSchema, registerAbonoSchema
- [x] F1.3 Create `lib/services/clientes.ts` — CRUD, getDeudaCliente (aggregation), registerAbono
- [x] F1.4 Run `npx prisma migrate dev` for schema removal

## Phase 2: Server Actions + List Page

- [x] F2.1 Create `app/dashboard/clientes/actions.ts` — getClientesAction, getClienteByIdAction, createClienteAction, updateClienteAction, deleteClienteAction, registerAbonoAction
- [x] F2.2 Create `components/clientes/ClienteList.tsx` — filters (nombre, estado, telefono), sort, responsive table, deuda badge EN_DEUDA/AL_DIA
- [x] F2.3 Create `app/dashboard/clientes/page.tsx` wiring list + server actions

## Phase 3: Form + Detail + Abono UI

- [x] F3.1 Create `components/clientes/ClienteForm.tsx` — create/edit modes with Zod validation
- [x] F3.2 Create `components/clientes/ClienteDetail.tsx` — deuda badge, abono history desc order
- [x] F3.3 Create `components/clientes/AbonoForm.tsx` — dialog modal with monto, metodoPago, notas

## Phase 4: Pedidos Debt Integration

- [x] F4.1 Modify `lib/services/pedidos.ts` to call clientes service for deuda validation
- [x] F4.2 Modify `app/dashboard/pedidos/actions.ts` — validate (deuda + total) <= limiteCredito for FIADO
- [x] F4.3 Verify `components/layout/nav-links.tsx` has active /dashboard/clientes link

## Phase 5: Testing

- [ ] F5.1 Test Zod schemas: createClienteSchema valid/invalid, registerAbonoSchema monto <= 0
- [ ] F5.2 Test service: CLI-{year}-{counter} ID gen, getDeudaCliente aggregation excluding CANCELADO, registerAbono
- [ ] F5.3 Test actions: CRUD flow, auth guard (DOMICILIARIO denied), limiteCredito excedido error
- [ ] F5.4 Test pedidos integration: deuda warning display, cancelado excluded from debt calc
