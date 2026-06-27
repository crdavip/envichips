# Design: Visitas a Clientes

## Technical Approach

Add a `RegistroVisita` model with auto-creation on pedido ENTREGADO and manual creation via server action. Compute `ultimaVisita` as MAX of two sources (ENTREGADO pedidos + RegistroVisita). Surface a 7-day alert badge in the client list, detail page, and dashboard. All mutations atomic via Prisma transactions.

## Architecture Decisions

| Option | Tradeoffs | Decision |
|--------|-----------|----------|
| JSON/array field on Cliente vs separate model | JSON not queryable, no index, breaks normalization | **Separate `RegistroVisita` model** — indexable, queryable, clean schema |
| Prisma middleware for auto-visit vs explicit in transaction | Middleware: implicit, hard to debug, can't return typed errors | **Explicit `registroVisita.create` inside `actualizarEstado` transaction** — atomic, debuggable, satisfies the "fallback reverts" spec |
| Denormalized `ultimaVisita` on Cliente vs computed | Denormalized: stale if sync missed, extra migration | **Computed as `MAX(pedidos.fecha WHERE ENTREGADO, registroVisita.fecha)`** — always correct, no sync |
| New service file vs extend `clientes.ts` | New file: one-off vs cohesively grouped | **Extend `lib/services/clientes.ts`** — own model, own concern, existing pattern for cliente-scoped operations |
| Sequence diagram for atomicity |  | **Required** (config.yaml) |

## Data Flow

### Auto-visit (ENTREGADO transition)
```
actualizarEstado(id, { estado: "ENTREGADO" }, user)
  ↓
Prisma.$transaction([
  1. validate stock sufficiency
  2. update pedido → ENTREGADO + estadoCobro
  3. decrement stock for each item
  4. create HistorialEstado
  5. create RegistroVisita { clienteId, userId, fecha, notas: null }
])  ← any step fails → ALL rolled back
```

### Manual visit
```
ClienteDetail/ClienteList
  → click "Registrar Visita"
  → open modal (notas optional)
  → registrarVisitaAction(clienteId, notas?)
    → requireRole("ADMIN", user)
    → Zod validate
    → db.registroVisita.create()
    → revalidatePath("/clientes")
    → return { data }
```

### Dashboard counter
```
DashboardPage (server)
  → getResumenDelDia()
    → query: COUNT clientes activos WHERE
        (NOT EXISTS registroVisita AND creadoEn < now() - 7d)
        OR (MAX(registroVisita.fecha) < now() - 7d AND no ENTREGADO pedido after that)
    → include in ResumenDelDia.clientesSinVisita
  → render stat card
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modify | Add `RegistroVisita` model with indexes |
| `lib/services/clientes.ts` | Modify | Add `getUltimaVisita()`, `registrarVisita()`, `getClientesSinVisita()` |
| `lib/services/pedidos.ts` | Modify | In `actualizarEstado()` at step 7 (ENTREGADO), add `registroVisita.create` inside transaction |
| `lib/services/informes.ts` | Modify | Add `clientesSinVisita` count to `getResumenDelDia()` |
| `lib/validations/clientes.ts` | Modify | Add `registrarVisitaSchema` + `RegistrarVisitaInput` |
| `app/(dashboard)/clientes/actions.ts` | Modify | Add `registrarVisitaAction()` |
| `components/clientes/VisitaButton.tsx` | Create | Modal button + dialog for manual visit registration |
| `components/clientes/ClienteList.tsx` | Modify | Add "Última visita" column with 7d badge |
| `components/clientes/ClienteDetail.tsx` | Modify | Add "Última visita" section + VisitaButton |
| `app/(dashboard)/page.tsx` | Modify | Add "Clientes sin visita" stat card |

## Interfaces / Contracts

```typescript
// lib/validations/clientes.ts — add
export const registrarVisitaSchema = z.object({
  clienteId: z.string().uuid(),
  notas: z.string().max(500).optional(),
});
export type RegistrarVisitaInput = z.output<typeof registrarVisitaSchema>;

// lib/services/clientes.ts — add
export interface UltimaVisitaResult {
  fecha: Date | null;       // null = nunca visitado
  tipo: "pedido" | "manual" | null;
  notas?: string | null;
}

// informes.ts — extend
// Add to ResumenDelDia:
//   clientesSinVisita: number;
```

## Testing Strategy

No test runner configured. Verify via:
| Layer | What | Approach |
|-------|------|----------|
| Integration | Auto-visita on ENTREGADO | Manually transition pedido → ENTREGADO, check RegistroVisita created |
| Integration | Atomic rollback on error | Trigger FK error, verify pedido stays PENDIENTE |
| Manual | Manual visit from UI | Click button, fill modal, verify row in DB |
| Manual | Dashboard counter | Create clientes with old creadoEn, verify card count |

## Migration / Rollout

1. `npx prisma migrate dev --name add_registro_visita` — creates new table with index
2. One PR: schema + services + actions (backend)
3. One PR: components + dashboard (UI)
4. No data migration needed (empty table at creation)

## Open Questions

- [ ] Should the dashboard filter link (`/clientes?filter=sin-visita`) use a real query param or just navigate with a default sort?
- [ ] The 7-day constant: is it acceptable as a `const` in `clientes.ts` or should it be in `BusinessConfig`?
