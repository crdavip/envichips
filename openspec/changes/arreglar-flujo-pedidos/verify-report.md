## Verification Report

**Change**: arreglar-flujo-pedidos
**Version**: 1.0
**Mode**: Standard (no test runner configured — strict_tdd: false)

### Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 18 |
| Tasks complete | 18 (all [x] in tasks.md) |
| Tasks incomplete | 0 |

### Build & Tests Execution

**Build**: ✅ Passed — zero errors

```text
▲ Next.js 16.2.7 (Turbopack)
✓ Compiled successfully in 4.7s
✓ TypeScript check passed
✓ 19/19 static pages generated
✓ All routes compiled (app router)
```

**Tests**: ➖ Not available — no test runner configured in project. Strict TDD is disabled. All verification is based on static code analysis and build success.

**Coverage**: ➖ Not available — no coverage tool configured.

### Spec Compliance Matrix

| Requirement | Scenario | Evidence | Result |
|-------------|----------|----------|--------|
| EstadoCobro Enum | Enum with PENDIENTE, COBRADO_PARCIAL, COBRADO | `prisma/schema.prisma:124-128` | ✅ COMPLIANT |
| EstadoCobro field | `estadoCobro` on Pedido | `prisma/schema.prisma:155` | ✅ COMPLIANT |
| Crear Pedido siempre PENDIENTE | Venta directa sin domiciliario → PENDIENTE | `lib/services/pedidos.ts:208` — `const estado: EstadoPedido = "PENDIENTE"` unconditional | ✅ COMPLIANT |
| Gestión Estados — role-aware | DOMICILIARIO limited transitions | `lib/services/pedidos.ts:263-278` — DOMICILIARIO gets DOMICILIARIO_TRANSITIONS, ADMIN full | ✅ COMPLIANT |
| DOMICILIARIO PENDIENTE→EN_CAMINO | Own pedido, allowed transition | `lib/services/pedidos.ts:151-154` — DOMICILIARIO_TRANSITIONS includes PENDIENTE→EN_CAMINO | ✅ COMPLIANT |
| DOMICILIARIO EN_CAMINO→ENTREGADO | Own pedido, allowed transition | `lib/services/pedidos.ts:151-154` — DOMICILIARIO_TRANSITIONS includes EN_CAMINO→ENTREGADO | ✅ COMPLIANT |
| DOMICILIARIO no puede saltar estados | PENDIENTE→ENTREGADO blocked for DOMICILIARIO | `lib/services/pedidos.ts:272` throws error for DOMICILIARIO | ✅ COMPLIANT |
| Admin PENDIENTE→ENTREGADO | Direct sale transition | `lib/services/pedidos.ts:147` — ALLOWED_TRANSITIONS includes PENDIENTE→ENTREGADO | ✅ COMPLIANT |
| Stock validation antes ENTREGADO | Stock insuficiente → error | `lib/services/pedidos.ts:327-338` — stock check before decrement (in transaction) | ✅ COMPLIANT |
| TomarPedido atomic | Conditional WHERE + transaction | `lib/services/pedidos.ts:470-502` — `updateMany` with WHERE `{domiciliarioId: null, estado: PENDIENTE}` | ✅ COMPLIANT |
| TomarPedido creates HistorialEstado | motivo "Domiciliario asignado por auto-asignación" | `lib/services/pedidos.ts:487-495` | ✅ COMPLIANT |
| confirmarCobroAdmin sets estadoCobro=COBRADO | Admin confirms | `lib/services/pedidos.ts:522` sets `estadoCobro: "COBRADO"` | ✅ COMPLIANT |
| confirmarCobroAdmin creates HistorialEstado | motivo "Cobro confirmado por administrador" | `lib/services/pedidos.ts:532-540` | ✅ COMPLIANT |
| EFECTIVO — estadoCobro on ENTREGADO | Payment-method-aware | `lib/services/pedidos.ts:307-308` — EFECTIVO+cobro → COBRADO_PARCIAL | ⚠️ PARTIAL |
| TRANSFERENCIA — estadoCobro on ENTREGADO | Payment-method-aware | `lib/services/pedidos.ts:309-310` — TRANSFERENCIA → COBRADO_PARCIAL (always) | ⚠️ PARTIAL |
| FIADO — estadoCobro on ENTREGADO | Always PENDIENTE | `lib/services/pedidos.ts:311-313` — else → PENDIENTE (covers FIADO) | ✅ COMPLIANT |
| updateEstadoAction — no ADMIN guard | Role check delegated to service | `app/(dashboard)/pedidos/actions.ts:114-141` — no `requireRole`, passes user to service | ✅ COMPLIANT |
| tomarPedidoAction requires DOMICILIARIO | Auth guard | `app/(dashboard)/pedidos/actions.ts:149` — `requireRole("DOMICILIARIO")` | ✅ COMPLIANT |
| Update schemas EstadoCobro | Validation schemas | `lib/validations/pedidos.ts:14-18` — EstadoCobroEnum defined, `updateEstadoSchema` includes estadoCobro | ✅ COMPLIANT |
| getPedidos DOMICILIARIO OR query | Available + own orders | `lib/services/pedidos.ts:66-71` — OR: `{PENDIENTE, null}` OR `{userId}` | ✅ COMPLIANT |
| getResumenDomiciliario | Returns disponibles, activos, entregadosHoy, totalVendidoHoy | `lib/services/informes.ts:316-348` — full implementation | ✅ COMPLIANT |
| Dashboard DOMICILIARIO 3 cards | Role-based page | `app/(dashboard)/page.tsx:206-278` — DashboardDomiciliario with 3 cards | ✅ COMPLIANT |
| PedidoList DOMICILIARIO tabs | Disponibles / Mis pedidos | `components/pedidos/PedidoList.tsx:207-443` — tabbed view | ✅ COMPLIANT |
| TomarPedidoButton exists | Component with action | `components/pedidos/TomarPedidoButton.tsx:13-68` — full client component | ✅ COMPLIANT |
| PedidoDetail estadoCobro badges | Badges per spec | `components/pedidos/PedidoDetail.tsx:604-658` — COBRADO/COBRADO_PARCIAL/FIADO/PENDIENTE | ✅ COMPLIANT |
| Entregar modal payment-method-aware | FIADO/TRANSFERENCIA/EFECTIVO | `components/pedidos/PedidoDetail.tsx:723-822` — 3 variants | ✅ COMPLIANT |
| puedeConfirmarCobro check | estadoCobro === "COBRADO_PARCIAL" | `components/pedidos/PedidoDetail.tsx:256-259` ✅ | ✅ COMPLIANT |

**Compliance summary**: 25/27 scenarios compliant, 2 partial (documented deviations)

### Correctness (Static Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| EstadoCobro enum | ✅ Implemented | Schema enum with 3 values + migration-ready |
| createPedido always PENDIENTE | ✅ Implemented | No conditional; always PENDIENTE |
| Role-aware actualizarEstado | ✅ Implemented | DOMICILIARIO limited, ADMIN full, SUPERADMIN full |
| tomarPedido atomic | ✅ Implemented | Prisma transaction + conditional WHERE |
| confirmarCobroAdmin | ✅ Implemented | Sets COBRADO + HistorialEstado |
| Stock validation | ✅ Implemented | Iterates items, checks stockActual >= cantidad |
| PENDIENTE→ENTREGADO in transitions | ✅ Implemented | ALLOWED_TRANSITIONS includes it |
| EstadoCobro derivation | ⚠️ Spec deviation | EFECTIVO→COBRADO_PARCIAL (spec: COBRADO), TRANSFERENCIA→COBRADO_PARCIAL always (spec: COBRADO if confirmed) |
| updateEstadoAction no ADMIN guard | ✅ Implemented | Delegated to service |
| tomarPedidoAction DOMICILIARIO guard | ✅ Implemented | requireRole("DOMICILIARIO") |
| getPedidos DOMICILIARIO | ✅ Implemented | OR query, no today-only default |
| getResumenDomiciliario | ✅ Implemented | 4 metrics returned |
| DOMICILIARIO dashboard | ✅ Implemented | 3 cards, hides Quick Actions |
| PedidoList tabs | ✅ Implemented | Disponibles / Mis pedidos |
| TomarPedidoButton | ✅ Implemented | Client button with loading/success/error |
| estadoCobro badges | ✅ Implemented | 4 states handled |
| Payment-aware entregar modal | ✅ Implemented | FIADO→info, TRANSFERENCIA→sí/no, EFECTIVO→full form |
| puedeConfirmarCobro | ✅ Implemented | Checks estadoCobro + isAdmin + estado ENTREGADO |

### Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| Service-level role checks (not action-level) | ✅ Yes | `actualizarEstado` receives user and validates internally |
| Conditional WHERE for tomarPedido | ✅ Yes | `updateMany` with WHERE `{domiciliarioId: null, estado: PENDIENTE}` |
| EstadoCobro enum over booleans | ✅ Yes | Enum with 3 values added, old fields kept for rollback |
| Keep dineroCobrado/montoCobrado 1 cycle | ✅ Yes | Fields still in schema |
| DOMICILIARIO dashboard 3 cards | ✅ Yes | disponibles, activos, entregados (with total $) |
| PedidoList tabbed view | ✅ Yes | Disponibles + Mis pedidos tabs |
| TomarPedidoButton | ✅ Yes | Client component with router.refresh |
| EstadoCobro badges per spec | ⚠️ Deviation | Badge variant "warning" used for COBRADO_PARCIAL (determined at build time if supported) |
| EFECTIVO → COBRADO derivation | ⚠️ Deviation | Code sets COBRADO_PARCIAL, design/spec said COBRADO — intentionally changed so admin must confirm |
| TRANSFERENCIA derivation | ⚠️ Deviation | Always COBRADO_PARCIAL, spec had conditional — same admin-confirm reasoning |
| Stock validation order | ⚠️ Non-ideal | stock check AFTER `pedido.update()` (still safe due to transaction rollback) |

### Issues Found

**CRITICAL**: None

**WARNING**:
1. **EstadoCobro derivation deviates from spec**: EFECTIVO+cobro → code sets `COBRADO_PARCIAL` instead of spec's `COBRADO`. TRANSFERENCIA always → `COBRADO_PARCIAL` regardless of dineroCobrado toggle. This is intentional (admin must fully confirm via `confirmarCobroAdmin`) but remains a spec deviation. The apply-progress documented this.
2. **Stock validation ordering**: Code performs `pedido.update()` (line 316) BEFORE stock sufficiency check (lines 327-338). Safe because Prisma transaction rolls back on throw, but inefficient — validation should precede mutation.

**SUGGESTION**:
1. **Spec update needed**: Update `openspec/specs/estado-cobro/spec.md` to reflect the actual behavior: EFECTIVO → COBRADO_PARCIAL (needs admin confirmation), TRANSFERENCIA → COBRADO_PARCIAL (always needs admin confirmation). The spec currently says COBRADO for both confirmed cases.
2. **Stock validation optimization**: Move stock check (lines 327-338) BEFORE `pedido.update()` (line 316) for efficiency. Prisma transaction ensures correctness either way, but checking first prevents wasted writes.
3. **puedeConfirmarCobro sugestion**: Optionally add `!pagoEntregadoAdmin` check to prevent showing the confirm button after a previous confirmation (the service already rejects double-confirmation).

### Verdict

**PASS WITH WARNINGS**

All 18 tasks are complete. Build passes with zero errors. All critical requirements are implemented (schema, services, actions, UI). Two spec deviations exist (EFECTIVO/TRANSFERENCIA estadoCobro derivation → COBRADO_PARCIAL instead of COBRADO) but are intentional design decisions to enforce admin confirmation. Project has no test runner — only static analysis was used.
