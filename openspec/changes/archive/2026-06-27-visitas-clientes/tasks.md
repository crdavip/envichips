# Tasks: Visitas a Clientes

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~330–400 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Backend) → PR 2 (Frontend) |
| Delivery strategy | chained PRs (stacked-to-main) |
| Chain strategy | stacked-to-main (user chose) |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Schema + services + actions + validation | PR 1 | Base → main. Migration, types, queries, mutation, server action. |
| 2 | UI components + dashboard card | PR 2 | Stacked on PR 1 → main. Button, modal, columns, stat card. |

## Phase 1: Foundation

- [x] 1.1 Add `RegistroVisita` model to `prisma/schema.prisma` with FK to Cliente + User, index on `[clienteId, fecha]`
- [x] 1.2 Add `getUltimaVisita()`, `registrarVisita()`, `getClientesSinVisita(dias)`, `getHistorialVisitas()` to `lib/services/clientes.ts`
- [x] 1.3 Add `registrarVisitaSchema` + `RegistrarVisitaInput` to `lib/validations/clientes.ts`

## Phase 2: Core Logic

- [x] 2.1 Modify `actualizarEstado()` in `lib/services/pedidos.ts` — add `registroVisita.create` inside the `ENTREGADO` block (step 7)
- [x] 2.2 Add `clientesSinVisita` count to `ResumenDelDia` + `getResumenDelDia()` query in `lib/services/informes.ts`

## Phase 3: Integration

- [x] 3.1 Add `registrarVisitaAction()` to `app/(dashboard)/clientes/actions.ts` with `requireRole("ADMIN")`, Zod validation, and `revalidatePath`

## Phase 4: UI Components

- [x] 4.1 Create `components/clientes/RegistrarVisitaForm.tsx` — modal dialog with optional notas field, role-gated to ADMIN/SUPERADMIN
- [x] 4.2 Modify `components/clientes/ClienteList.tsx` — add "Última visita" column with badges (7d alert) + RegistrarVisitaForm per row + "Sin visita" filter
- [x] 4.3 Modify `components/clientes/ClienteDetail.tsx` — add "Visitas" section with last visit info, historial, and "Registrar visita" button

## Phase 5: Dashboard

- [x] 5.1 Modify `app/(dashboard)/page.tsx` — add "Clientes sin visita" stat card with count link to `/clientes`
