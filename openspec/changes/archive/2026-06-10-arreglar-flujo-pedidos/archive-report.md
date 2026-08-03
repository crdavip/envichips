# Archive Report: arreglar-flujo-pedidos

**Archived**: 2026-06-10
**Mode**: openspec (file-based)

## Change Summary

**Proposal**: Arreglar Flujo de Pedidos — DOMICILIARIO role could not execute their workflow because server-side blocked with `requireRole("ADMIN")`, no self-assignment mechanism existed, and direct sales skipped PENDIENTE state. The cobro cycle did not distinguish payment methods.

**Scope**: Role-aware state transitions, auto-asignación (tomar pedido), always-PENDIENTE creation, DOMICILIARIO dashboard + listado, EstadoCobro enum with payment-method awareness, stock validation before ENTREGADO.

## Task Completion Gate

- All 18 tasks marked `[x]` in tasks.md: ✅ Pass
- No CRITICAL issues in verify-report: ✅ Pass
- Verdict: **PASS WITH WARNINGS**
- No stale-checkbox reconciliation needed

## Spec Sync Summary

| Domain | Action | Details |
|--------|--------|---------|
| `pedidos` | Updated | 6 sections merged (Crear, Listado, Estados, Cobro, Actions, Validaciones). Added role-aware transitions, EstadoCobro derivation, stock validation, auto-asignación. Removed old ENTREGADO-auto behavior. |
| `estado-cobro` | Updated | Corrected EFECTIVO→COBRADO_PARCIAL and TRANSFERENCIA→COBRADO_PARCIAL behavior (intentional deviation from original spec requiring COBRADO). Added deviation documentation. |
| `asignacion-domiciliario` | Updated | Expanded with auto-asignación mechanism, PENDIENTE-only restriction for DOMICILIARIO, concurrency requirement. |
| `informes` | Updated | Added Section 9: Dashboard DOMICILIARIO with 3 cards, service requirements, and access control updates. |
| `auto-asignacion-pedidos` | No change | Already matched implementation. |

## Spec Deviations Recorded

1. **EFECTIVO → COBRADO_PARCIAL**: Original spec said EFECTIVO+cobro → COBRADO. Implementation sets COBRADO_PARCIAL so admin must confirm via `confirmarCobroAdmin`. Intentional — enforces admin oversight of cash collection.
2. **TRANSFERENCIA → COBRADO_PARCIAL (always)**: Original spec had conditional COBRADO. Implementation always sets COBRADO_PARCIAL regardless of `dineroCobrado` toggle. Same admin-confirm reasoning.
3. **Stock validation ordering**: Stock check happens AFTER `pedido.update()` (safe due to Prisma transaction rollback) rather than before — flagged as WARNING in verify-report.

Both deviations are documented as intentional in the verify-report and in the updated estado-cobro spec.

## Archive Contents

| Artifact | Path | Status |
|----------|------|--------|
| proposal.md | `archive/2026-06-10-arreglar-flujo-pedidos/proposal.md` | ✅ |
| specs/pedidos/spec.md | `archive/2026-06-10-arreglar-flujo-pedidos/specs/pedidos/spec.md` | ✅ |
| specs/asignacion-domiciliario/spec.md | `archive/2026-06-10-arreglar-flujo-pedidos/specs/asignacion-domiciliario/spec.md` | ✅ |
| specs/informes/spec.md | `archive/2026-06-10-arreglar-flujo-pedidos/specs/informes/spec.md` | ✅ |
| design.md | `archive/2026-06-10-arreglar-flujo-pedidos/design.md` | ✅ |
| tasks.md | `archive/2026-06-10-arreglar-flujo-pedidos/tasks.md` | ✅ (18/18 tasks complete) |
| verify-report.md | `archive/2026-06-10-arreglar-flujo-pedidos/verify-report.md` | ✅ |

## Source of Truth Updated

The following main specs now reflect the new behavior:
- `openspec/specs/pedidos/spec.md`
- `openspec/specs/estado-cobro/spec.md`
- `openspec/specs/asignacion-domiciliario/spec.md`
- `openspec/specs/informes/spec.md`

## Risks

- `estado-cobro` spec deviation is documented as intentional. If future work depends on direct COBRADO derivation, the estado-cobro spec must be re-evaluated.
- Old `dineroCobrado`/`montoCobrado` fields kept for 1 archive cycle per design — should be cleaned up in a future change.

## SDD Cycle Complete

The change has been fully planned, implemented, verified, and archived.
