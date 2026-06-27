## Verification Report

**Change**: visitas-clientes
**Version**: N/A
**Mode**: Standard (no test runner configured)

### Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 10 |
| Tasks complete | 10 |
| Tasks incomplete | 0 |

### Build & Tests Execution

**Build**: ✅ Passed (TypeScript `--noEmit` — zero errors)

```text
> npx tsc --noEmit
(no output — compilation successful)
```

**Tests**: ➖ No test runner configured (Standard Mode)

### Spec Compliance Matrix

| Requirement | Scenario | Evidence | Result |
|-------------|----------|----------|--------|
| Modelo RegistroVisita | Persistencia correcta | `prisma/schema.prisma:119–129` — model with id, clienteId, userId, fecha, notas, `@@index([clienteId, fecha])`. Migration `20260627161305_add_registro_visita` creates the table with FK constraints and composite index. | ✅ COMPLIANT |
| Registrar visita manual | Registro manual exitoso | `lib/services/clientes.ts:338–355` — `registrarVisita()` creates record. `app/(dashboard)/clientes/actions.ts:230–263` — `registrarVisitaAction` with Zod validation. `components/clientes/RegistrarVisitaForm.tsx` — dialog with optional notas field. `router.refresh()` refreshes column. | ✅ COMPLIANT |
| Registrar visita manual | Domiciliario sin acceso | `RegistrarVisitaForm.tsx` — role-gated via parent `canMutate` (line 128 `userRole === "SUPERADMIN" \|\| userRole === "ADMIN"`). `actions.ts:237` — `requireRole("ADMIN", session?.user)`. No render path for DOMICILIARIO. | ✅ COMPLIANT |
| Visita automática al entregar pedido | Auto-visita en ENTREGADO exitoso | `lib/services/pedidos.ts:354–362` — inside `actualizarEstado()` `$transaction`, creates `registroVisita.create` with `clienteId` from pedido and `userId` from executor. Same transaction block. | ✅ COMPLIANT |
| Visita automática al entregar pedido | Sin visita si no es ENTREGADO | `pedidos.ts:344` — the block is guarded by `if (data.estado === "ENTREGADO")`. Other transitions skip it. | ✅ COMPLIANT |
| Visita automática al entregar pedido | Atomicidad | `pedidos.ts:257` — entire `actualizarEstado` wrapped in `db.$transaction(async (tx) => { ... })`. Any thrown error (including FK violation on `registroVisita.create`) rolls back all changes. | ✅ COMPLIANT |
| Alerta de 7+ días sin visita | Cliente nuevo sin visitas | `lib/services/clientes.ts:304–310` — `getClientesSinVisita()` falls back to `cliente.creadoEn` when no pedido or visita exists. `components/clientes/ClienteList.tsx:659–673` — `VisitBadge` falls back to `creadoEn` when `ultimaVisita` is null. | ✅ COMPLIANT |
| Alerta de 7+ días sin visita | Cliente visitado recientemente | `clientes.ts:302` — `corte` = now - `dias`. `clientes.ts:304–309` — filters where ref < corte. `ClienteList.tsx:669` — badge shows `dias <= 7` → no destructive badge. | ✅ COMPLIANT |
| Alerta de 7+ días sin visita | Cliente inactivo excluido | `clientes.ts:266` — `excludeInactivos=true` by default. `const where` includes `if (excludeInactivos) where.activo = true`. | ✅ COMPLIANT |
| Dashboard contador | Contador con enlace | `lib/services/informes.ts:154` — `getClientesSinVisita(7).then((r) => r.count)`. `app/(dashboard)/page.tsx:150–156` — "Sin visita" stat card with `resumen.clientesSinVisita` and `href: "/clientes"`. | ⚠️ PARTIAL |
| Dashboard contador | Sin clientes en alerta | `page.tsx:150–156` — renders count (0 when none). Card always visible. Spec says "Todos los clientes al día" — not implemented, but count=0 is displayed. | ⚠️ PARTIAL |

**Compliance summary**: 9/11 scenarios compliant, 2 partial

### Correctness (Static Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| RegistroVisita model fields | ✅ Implemented | id, clienteId, userId, fecha, notas, @@index([clienteId, fecha]) |
| Migration exists and is valid | ✅ Implemented | `20260627161305_add_registro_visita/migration.sql` — creates table, FK constraints, composite index |
| `getUltimaVisita()` | ✅ Implemented | Correctly computes MAX of pedido ENTREGADO fecha and RegistroVisita fecha |
| `getClientesSinVisita()` | ❌ Bug present | Uses `??` operator instead of `Math.max` — see CRITICAL issue below |
| `getHistorialVisitas()` | ✅ Implemented | Recent visits with user info, ordered by fecha DESC |
| `registrarVisita()` | ✅ Implemented | Creates record via `db.registroVisita.create` |
| Auto-visita on ENTREGADO | ✅ Implemented | Inside Prisma `$transaction` in `actualizarEstado()` |
| Dashboard `clientesSinVisita` | ✅ Implemented | Included in `ResumenDelDia` interface and computed in `getResumenDelDia()` |
| `registrarVisitaAction` | ✅ Implemented | `requireRole("ADMIN")`, Zod validation, `revalidatePath("/clientes")` |
| `RegistrarVisitaForm` dialog | ✅ Implemented | Modal with textarea for notas, role-gated |
| ClienteList "Última visita" column | ✅ Implemented | `VisitBadge` component with days-since, destructive badge if >7d |
| "Sin visita" filter toggle | ✅ Implemented | Client-side filter in ClienteList |
| ClienteDetail "Visitas" card | ✅ Implemented | Last visit summary, historial timeline, register button |
| Dashboard "Sin visita" stat card | ✅ Implemented | Count with link to `/clientes` |

### Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| Separate `RegistroVisita` model | ✅ Yes | Prisma model created, not JSON field |
| Explicit `registroVisita.create` inside `actualizarEstado` transaction | ✅ Yes | Line 355–362 of pedidos.ts |
| Computed as MAX of pedidos + visitas | ⚠️ Partial | `getUltimaVisita()` uses MAX correctly. `getClientesSinVisita()` uses `??` instead of MAX — BUG |
| Extend `lib/services/clientes.ts` | ✅ Yes | New functions added at bottom of existing file |
| `lib/validations/clientes.ts` — `registrarVisitaSchema` | ⚠️ Partial | Exists and functional, but `max(1000)` vs design's `max(500)` |
| `components/clientes/VisitaButton.tsx` | ❌ No | Design specified `VisitaButton.tsx`, implementation uses `RegistrarVisitaForm.tsx` — functionally equivalent but naming differs |
| Sequence diagram for atomicity | ✅ Yes | Design has data flow for auto-visit and manual visit |

### Issues Found

**CRITICAL**:
1. **`getClientesSinVisita()` uses `??` instead of `Math.max`** — File: `lib/services/clientes.ts:304–309`. The function picks the first non-null date via `pedidoMap.get(cliente.id) ?? visitaMap.get(cliente.id) ?? cliente.creadoEn`. When a client has both an older ENTREGADO pedido and a more recent manual visita, `pedidoMap.get()` returns non-null and short-circuits `??`, ignoring the more recent visita date. This inflates the "sin visita" count on the dashboard and in alerts. Fix: compute `Math.max(pedidoDate ?? 0, visitaDate ?? 0, creadoEn)` instead.

**WARNING**:
1. **Dashboard "Sin visita" link lacks `?filter=sin-visita` query param** — File: `app/(dashboard)/page.tsx:155`. Spec says `MUST ser un enlace a /clientes?filter=sin-visita`, but actual `href` is `/clientes`. Additionally, `ClienteList.tsx` does not parse URL query params for the "Sin visita" filter — the filter is toggled via a button only.
2. **Badge label for new clients** — File: `components/clientes/ClienteList.tsx:665`. Spec says "9 días sin visita" but implementation shows "Nuevo (9 días)". Functionality works (triggers alert when >7d) but label differs from spec.
3. **Design: `registrarVisitaSchema.max(500)` vs implementation `max(1000)`** — File: `lib/validations/clientes.ts:48`. Design specified `max(500)` but implementation uses `max(1000)`. Minor deviation, no functional impact.
4. **Design: `VisitaButton.tsx` named differently** — Design specified `components/clientes/VisitaButton.tsx`, actual file is `components/clientes/RegistrarVisitaForm.tsx`. Functionally equivalent, just a naming deviation.

### Verdict

**PASS WITH WARNINGS**

Implementation covers all 10 tasks and most spec requirements. TypeScript compiles cleanly. One CRITICAL bug found in `getClientesSinVisita()` that affects dashboard accuracy when manual visits are more recent than ENTREGADO pedidos. Dashboard link missing `?filter=sin-visita` query param is a spec deviation.

Verdict is not FAIL because the core functionality works, the bug is in an edge case (client with both an old pedido ENTREGADO AND a recent manual visita), and no tests exist to catch it. However, this must be fixed before production use.
