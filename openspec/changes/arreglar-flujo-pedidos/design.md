# Design: Arreglar Flujo de Pedidos

## Technical Approach

Four stacked PRs refactoring the pedido lifecycle: (1) schema + auth fix, (2) DOMICILIARIO dashboard, (3) payment-method-aware cobro, (4) stock validation + polish. Each PR lands independently to main. Architecture: service-layer role checks replace `requireRole()` in actions, atomic `tomarPedido` with conditional `WHERE`, and `EstadoCobro` enum replaces boolean `dineroCobrado`.

---

## Role-Permission Matrix

| Action | DOMICILIARIO | ADMIN | SUPERADMIN |
|--------|:---:|:---:|:---:|
| Crear pedido | ❌ | ✅ | ✅ |
| Tomar pedido (auto-asignar) | ✅ | ❌ | ❌ |
| Asignar domiciliario manual | ❌ | ✅ | ✅ |
| PENDIENTE→EN_CAMINO (propio) | ✅ | ✅ | ✅ |
| EN_CAMINO→ENTREGADO (propio) | ✅ | ✅ | ✅ |
| PENDIENTE→ENTREGADO (directa) | ❌ | ✅ | ✅ |
| CANCELAR | ❌ | ✅ | ✅ |
| Confirmar cobro admin | ❌ | ✅ | ✅ |

---

## PR 1 — Schema + Auth Fix (≈380 lines)

**Goal**: Unblock DOMICILIARIO transitions, add EstadoCobro, prevent race conditions on tomar.

### Data Model

```diff
enum EstadoPedido { PENDIENTE, EN_CAMINO, ENTREGADO, CANCELADO }
+ enum EstadoCobro { PENDIENTE, COBRADO_PARCIAL, COBRADO }

model Pedido {
  ...
  dineroCobrado      Boolean?          // keep 1 cycle for rollback
  montoCobrado       Int?
  pagoEntregadoAdmin  Boolean          @default(false)
  pagoEntregadoEn    DateTime?
+ estadoCobro        EstadoCobro       @default(PENDIENTE)
}
```

### Service Changes (`lib/services/pedidos.ts`)

| Change | Description |
|--------|-------------|
| `createPedido` | Remove line 194 (`estado: data.domiciliarioId ? "PENDIENTE" : "ENTREGADO"`) → always PENDIENTE. Remove lines 221-249 (stock decrement + HistorialEstado for direct sale). Always create PENDIENTE→PENDIENTE historial. |
| `actualizarEstado` | Add `cambiadoPor` role check param. DOMICILIARIO: only own orders, only `PENDIENTE→EN_CAMINO` or `EN_CAMINO→ENTREGADO`. ADMIN: all transitions. Add `PENDIENTE`→`ENTREGADO` to `ALLOWED_TRANSITIONS` for admin. |
| `tomarPedido(id, domiciliarioId)` | **New**. `tx.pedido.update({ where: { id, domiciliarioId: null, estado: "PENDIENTE" }, data: { domiciliarioId } })`. Checks `count` > 0, creates HistorialEstado. |
| `confirmarCobroAdmin` | Add `tx.historialEstado.create(...)` with motivo "Cobro confirmado por administrador" |

### Action Changes (`app/(dashboard)/pedidos/actions.ts`)

| Change | Description |
|--------|-------------|
| `updateEstadoAction` | Remove `requireRole("ADMIN")` line 118. Pass session user to service — service does permission check. |
| `tomarPedidoAction(id)` | **New**. `requireAuth` + check `session.user.rol === "DOMICILIARIO"`. Calls `tomarPedido(id, session.user.id)`. Revalidate `/pedidos`. |

### Validation Changes (`lib/validations/pedidos.ts`)

```diff
+ const EstadoCobroEnum = z.enum(["PENDIENTE", "COBRADO_PARCIAL", "COBRADO"]);
+ // updateEstadoSchema: add estadoCobro?
+ const updateEstadoSchema = z.object({
    estado: EstadoPedidoEnum,
    motivo: z.string().min(1).optional(),
    dineroCobrado: z.boolean().optional(),
    montoCobrado: z.number().int().min(0).optional(),
+   estadoCobro: EstadoCobroEnum.optional(),
    cambiadoPorId: z.string().uuid(),
  });
```

### Schema Migration

```sql
CREATE TYPE "EstadoCobro" AS ENUM ('PENDIENTE', 'COBRADO_PARCIAL', 'COBRADO');
ALTER TABLE "Pedido" ADD COLUMN "estadoCobro" "EstadoCobro" NOT NULL DEFAULT 'PENDIENTE';

-- Backfill from existing data
UPDATE "Pedido" SET "estadoCobro" = 'COBRADO'
  WHERE "dineroCobrado" = true AND "pagoEntregadoAdmin" = true;
UPDATE "Pedido" SET "estadoCobro" = 'COBRADO_PARCIAL'
  WHERE "dineroCobrado" = true AND "pagoEntregadoAdmin" = false;
-- Default PENDIENTE for all others
```

### Sequence: Crear → Tomar → Entregar → Cobrar

```
Admin              Action              Service              DB
  │                  │                   │                   │
  │──createPedido───>│                   │                   │
  │                  │──createPedido()──>│                   │
  │                  │                   │──tx.pedido.create(estado:PENDIENTE)──>│
  │                  │                   │──historial(PENDIENTE→PENDIENTE)──────>│
  │<──200────────────│                   │                   │
  │                  │                   │                   │
Domiciliario         │                   │                   │
  │──tomarPedido────>│                   │                   │
  │                  │──tomarPedido()───>│                   │
  │                  │                   │──tx.pedido.update(WHERE id+domiciliarioId=null)──>│
  │                  │                   │──historial(asignado)─────────────────────────────>│
  │<──200────────────│                   │                   │
  │                  │                   │                   │
  │──updateEstado────>│                   │                   │
  │ (EN_CAMINO)      │──actualizarEstado(rolecheck)─────────>│
  │                  │                   │──tx.pedido.update(EN_CAMINO)──>│
  │<──200────────────│                   │                   │
  │                  │                   │                   │
  │──updateEstado────>│                   │                   │
  │ (ENTREGADO)      │──actualizarEstado(ESTADO check + stock)──>│
  │                  │                   │──stock validation──>│
  │                  │                   │──decrement stock───>│
  │                  │                   │──setup estadoCobro per metodoPago──>│
  │<──200────────────│                   │                   │
  │                  │                   │                   │
Admin                │                   │                   │
  │──confirmarCobro──>│                   │                   │
  │                  │──confirmarCobroAdmin()──────────────>│
  │                  │                   │──update estadoCobro=COBRADO───>│
  │                  │                   │──historial(cobro confirmado)──>│
  │<──200────────────│                   │                   │
```

---

## PR 2 — DOMICILIARIO Dashboard + Listado (≈350 lines)

**Goal**: DOMICILIARIO sees useful dashboard and listado with available pedidos.

### Service Changes (`lib/services/pedidos.ts`)

| Change | Description |
|--------|-------------|
| `getPedidos` | Replace "only today" hard filter (lines 65-73). For DOMICILIARIO: return `{ domiciliarioId: null, estado: "PENDIENTE" }` UNION `{ domiciliarioId: user.id }`. No "today" filter. |

### Service Changes (`lib/services/informes.ts`)

| Change | Description |
|--------|-------------|
| `getResumenDomiciliario(userId)` | **New** function. Returns `{ disponibles: number, activos: number, entregadosHoy: number, totalVendidoHoy: number }`. |

### Dashboard (`app/(dashboard)/page.tsx`)

| Change | Description |
|--------|-------------|
| Check `session.user.rol === "DOMICILIARIO"` | If true, render `<DashboardDomiciliario>` instead of `<DashboardStatsCards>`. |
| New `DashboardDomiciliario` component | Three cards: "Pedidos disponibles" (count + link), "En camino" (count + link), "Entregados hoy" (count + total $). Hide Quick Actions section. |

### Listado (`components/pedidos/PedidoList.tsx`)

| Change | Description |
|--------|-------------|
| `userRole === "DOMICILIARIO"` branching | Show tabbed view: "Disponibles" (PENDIENTE sin domiciliario) + "Mis pedidos" (propios). Filters hidden for DOMICILIARIO. |
| Add `TomarPedidoButton` | Rendered in "Disponibles" section for each pedido. |

### New Components

| File | Description |
|------|-------------|
| `components/pedidos/TomarPedidoButton.tsx` | Client button → calls `tomarPedidoAction(pedidoId)` → `router.refresh()`. Only shown when user.rol === "DOMICILIARIO". |

---

## PR 3 — Payment-Method-Aware Cobro (≈320 lines)

**Goal**: Modal ENTREGADO adapts to metodoPago, EstadoCobro badges.

### Service Changes (`lib/services/pedidos.ts`)

| Change | Description |
|--------|-------------|
| `actualizarEstado` | On ENTREGADO transition: based on `metodoPago` set `estadoCobro`. EFECTIVO: `dineroCobrado ? COBRADO : PENDIENTE`. TRANSFERENCIA: `dineroCobrado ? COBRADO_PARCIAL : PENDIENTE`. FIADO: always `PENDIENTE`. |

### Component Changes (`components/pedidos/PedidoDetail.tsx`)

| Change | Description |
|--------|-------------|
| Estado de Cobro card | Replace `dineroCobrado` logic with `estadoCobro` switch. PENDIENTE → badge warning, COBRADO_PARCIAL → badge secondary, COBRADO → badge success. |
| Entregar modal | Payment-method-aware: EFECTIVO → show dineroCobrado toggle + monto field (current). TRANSFERENCIA → show "¿El cliente hizo la transferencia?" sí/no (sets dineroCobrado boolean). FIADO → hide entire cobro section. |
| Confirmar cobro button | Only show when `estadoCobro === COBRADO_PARCIAL` AND `!pagoEntregadoAdmin` AND isAdmin. |

```typescript
// badge mapping
const cobroBadge: Record<string, { label: string; variant: string }> = {
  PENDIENTE: { label: "Pendiente de cobro", variant: "warning" },
  COBRADO_PARCIAL: { label: "Cobrado por domiciliario", variant: "secondary" },
  COBRADO: { label: "Cobrado", variant: "success" },
};
```

---

## PR 4 — Stock Validation + Polish (≈150 lines)

**Goal**: Prevent ENTREGADO when stock is insufficient, clear error UX.

### Service Changes (`lib/services/pedidos.ts`)

| Change | Description |
|--------|-------------|
| `actualizarEstado` | Before ENTREGADO (around line 301): iterate `pedido.items`, check `articulo.stockActual >= item.cantidad` for each. Throw descriptive error on failure. |

### Component Changes (`components/pedidos/PedidoDetail.tsx`)

| Change | Description |
|--------|-------------|
| Stock error in modal | Display error banner when entregar fails due to stock. |
| Disable "Marcar entregado" | Cross-check stock before enabling button — show tooltip when insufficient. |

---

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `requireRole` in action vs service | Action-level is simpler but inflexible; service-level enables nuanced per-transition checks | Service-level `actualizarEstado` receives user object and validates internally |
| `SELECT ... FOR UPDATE` vs conditional `WHERE` | FOR UPDATE needs raw SQL; conditional `WHERE` works with Prisma `update` and `count` | Conditional `WHERE` in `tomarPedido` — Prisma-native, atomic via transaction |
| New `EstadoCobro` enum vs three booleans | Enum is queryable (group by, filter); booleans are backward-compatible | Enum — matches existing Prisma pattern and enables future reports |
| Keep old fields vs drop immediately | Drop reduces tech debt; keep 1 cycle enables rollback | Keep `dineroCobrado`, `montoCobrado` for 1 archive cycle |

## Migration Strategy

1. Run Prisma migration: add `EstadoCobro` enum + field
2. Backfill: `dineroCobrado=true + pagoEntregadoAdmin=true → COBRADO`, `dineroCobrado=true + !pagoEntregadoAdmin → COBRADO_PARCIAL`, else `PENDIENTE`
3. Deploy PR 1 → verify → PR 2 → verify → PR 3 → verify → PR 4 → verify
4. After 1 cycle: archive migration to drop `dineroCobrado`, `montoCobrado`

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Race condition on `tomarPedido` | Low | Atomic `update` with conditional `WHERE` + Prisma transaction |
| `actualizarEstado` behavior change for existing clients | Medium | Return `{ error }` from action preserves existing contract; UI adapts via re-render |
| DOMICILIARIO workflow blocked by missing data (e.g., no PENDIENTE pedidos to take) | Low | Empty states and clear messaging designed per spec |
