# Design: Order Modification (Devoluciones y Modificación de Pedidos)

## Technical Approach

In-place PedidoItem modification within a single Prisma `$transaction`. Items are diffed against the current state: removed items deleted, existing items quantity-updated with recalculated subtotal/ganancia, new items created with current Articulo.precio/costo snapshots. Totals recalculated from scratch. HistorialEstado records the modification with `estadoAntes === estadoDespues` (same-state pattern, proven by `asignarDomiciliario`/`confirmarCobroAdmin`) and a descriptive `motivo`. Full re-validation of stock sufficiency for ALL final items. FIADO debt limit re-validated when total changes. No schema changes — no migration.

## Architecture Decisions

| # | Option | Tradeoff | Decision |
|---|--------|----------|----------|
| AD-1 | **New model / JSON field** on HistorialEstado for structured diffs | Enables future modification reporting but requires migration; textual motivo is adequate for current audit needs | **No schema changes** — same-state HistorialEstado with descriptive motivo string |
| AD-2 | **Selective stock validation** (only changed items) | Reduces DB reads but misses stock depletion on unchanged items since creation | **Full re-validation** — check stock sufficiency for ALL final items at modification time |
| AD-3 | **Version/lock field** on Pedido | Prevents concurrent edit races but adds migration + complexity; race window is very low | **Prisma `$transaction` default** — `findUniqueOrThrow` fails fast; no lock field |
| AD-4 | **New snapshot for ALL items** after modification | Simplifies logic but would lose original pricing on existing items (client invoice mismatch) | **Snapshot only new items** — existing items keep original `precio`/`costo`; new items capture current values |

## Data Flow

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────────────────┐
│  UI (Modal)  │────→│ modificarPedido │────→│ modificarPedido()        │
│  edit items  │     │ Action (server) │     │ Service (lib)            │
│  submit      │     │ validate + auth │     │ $transaction {           │
└──────────────┘     └─────────────────┘     │  1. findUniqueOrThrow    │
                                              │  2. validate state       │
                                              │  3. diff items           │
                                              │  4. snapshot new prices  │
                                              │  5. stock check (ALL)    │
                                              │  6. FIADO re-validation  │
                                              │  7. delete removed       │
                                              │  8. update existing qty  │
                                              │  9. create new items     │
                                              │ 10. recalculate totals   │
                                              │ 11. update Pedido        │
                                              │ 12. create Historial     │
                                              │ }                        │
                                              │ revalidatePath           │
                                              │ return { data }          │
                                              └──────────────────────────┘
```

## File Changes

| File | Action | Lines | Description |
|------|--------|-------|-------------|
| `lib/validations/pedidos.ts` | Modify | +20 | `modificarPedidoSchema`: items array (articuloId + cantidad) + motivo string (required, max 500) |
| `lib/services/pedidos.ts` | Modify | +100 | `modificarPedido()`: state validation, item diff, stock check, FIADO re-validation, $transaction with CRUD + totals recalc + audit |
| `app/(dashboard)/pedidos/actions.ts` | Modify | +40 | `modificarPedidoAction()`: session → requireRole(["ADMIN","SUPERADMIN"]) → safeParse → service → revalidatePath |
| `components/pedidos/PedidoDetail.tsx` | Modify | +200 | "Modificar pedido" button (visible when ADMIN + PENDIENTE/EN_CAMINO) + modal with editable qty inputs, add/remove products, motivo field, article search (reuse `getArticulosForPedidoAction`) |
| `openspec/specs/pedidos/spec.md` | Modify | +80 | New Section 4 subsection: modification allowed states, item rules, audit requirements |

## Interfaces / Contracts

```typescript
// lib/validations/pedidos.ts
export const modificarPedidoSchema = z.object({
  items: z
    .array(
      z.object({
        articuloId: z.string().uuid(),
        cantidad: z.number().int().positive("La cantidad debe ser mayor a 0"),
      }),
    )
    .min(1, "Debe incluir al menos un producto"),
  motivo: z
    .string()
    .min(1, "El motivo es requerido")
    .max(500, "El motivo no puede superar 500 caracteres"),
});
export type ModificarPedidoInput = z.output<typeof modificarPedidoSchema>;
```

Service signature (follows `actualizarEstado` shape):
```typescript
async function modificarPedido(
  id: string,
  data: ModificarPedidoInput & { cambiadoPorId: string },
  user: { id: string; rol: string },
): Promise<PedidoWithIncludes>
```

Error messages follow existing patterns (`err instanceof Error ? err.message : "..."`), caught by action and returned as `{ error: string }`.

## Testing Strategy

No automated test infrastructure available (see config.yaml `testing.strict_tdd: false`). Manual verification scenarios:

| Scenario | Steps | Expected |
|----------|-------|----------|
| Modify quantities | Change qty from 5→3 on existing item | Subtotal recalculated, total updated, HistorialEstado created with motivo |
| Add new item | Add new article to order with qty=2 | New PedidoItem with current precio/costo snapshots |
| Remove item | Delete one item from 3-item order | Item deleted, totals recalculated, min 1 item enforced |
| Stock validation | Modify qty from 10→15 when stock=12 | Error "Stock insuficiente", no changes persisted |
| FIADO re-validation | Modify FIADO order increasing total above client's limit | Error, no changes persisted |
| State gating | Try modifying ENTREGADO order | Error state validation |
| Role gating | DOMICILIARIO sees no button | Button not rendered |
| Same-state audit | After modification, check historial | `estadoAntes === estadoDespues`, motivo = "Items modificados: ..." |

## Migration / Rollout

No migration required — no schema changes, no data backfill. Feature becomes available immediately for ADMIN/SUPERADMIN on PENDIENTE or EN_CAMINO orders after deploy. No feature flag needed.

## Open Questions

None — the design is fully resolved per the proposal and exploration. All patterns (same-state audit, `$transaction`, Zod validation, role-gated actions) have prior art in the codebase.
