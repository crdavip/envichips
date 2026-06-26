# Specs: Devoluciones y Modificación de Pedidos — Modificación

> Envichips SaaS · Especificaciones detalladas
> Capacidad: `devoluciones-modificacion`

---

## 1. Modificación de Pedidos

**Files**: `lib/validations/pedidos.ts` (modificarPedidoSchema), `lib/services/pedidos.ts` (modificarPedido), `app/(dashboard)/pedidos/actions.ts` (modificarPedidoAction)

### Purpose

Allow ADMIN/SUPERADMIN to modify PENDIENTE or EN_CAMINO orders — edit quantities, add/remove items — with inventory validation, totals recalculation, and audit trail.

### Acceptance Criteria

**R1 — Access**: Only ADMIN and SUPERADMIN MUST access modification. DOMICILIARIO MUST NOT.

**R2 — Allowed states**: Modification MUST only be allowed for `PENDIENTE` or `EN_CAMINO`. `ENTREGADO` and `CANCELADO` MUST NOT be modifiable.

**R3 — Item operations**: MUST support quantity changes, item removal, and new item addition. Minimum 1 item MUST remain. Existing items keep snapshot `precio`/`costo`. New items snapshot current Articulo prices. Subtotal = `cantidad × precio`.

**R4 — Totals**: MUST recalculate `subtotal = Σ(item.subtotal)` and `total = subtotal - descuento` (descuento unchanged).

**R5 — Stock**: MUST validate `articulo.stockActual >= item.cantidad` for ALL items. If insufficient, reject entire modification with error. Stock MUST NOT be deducted.

**R6 — FIADO**: If `metodoPago = FIADO` and total changes, MUST re-validate via `validateFiadoDebt`. Reject with "Límite de crédito excedido" if exceeded.

**R7 — Audit**: MUST create HistorialEstado with `estadoAntes === estadoDespues`, descriptive `motivo` listing changes, and `cambiadoPorId`.

**R8 — Atomicity**: MUST use single Prisma `$transaction`. Full rollback on any failure.

**R9 — Schema** (`modificarPedidoSchema`):
- `items`: array of `{ articuloId: uuid, cantidad: int positive }`, min 1
- `motivo`: string, 1–500 chars, REQUIRED
- Items in request not in order → new items. Items in order not in request → removed.

**R10 — Action**: `modificarPedidoAction(id, raw)` following auth → validate → service → revalidatePath pattern.

### Test Scenarios

1. **Edit quantity**: GIVEN a PENDIENTE order with Papas x5, WHEN Admin changes to Papas x3, THEN quantity updated, subtotal recalculated, HistorialEstado created
2. **Add item**: GIVEN a PENDIENTE order, WHEN Admin adds Plátanos x2, THEN new PedidoItem created with current precio/costo, total recalculated
3. **Remove item**: GIVEN a PENDIENTE order with 3 items, WHEN Admin removes 1, THEN item deleted, total recalculated
4. **Remove all blocked**: GIVEN a PENDIENTE order with 1 item, WHEN Admin tries removing it, THEN error "Debe incluir al menos un producto"
5. **Stock validation**: GIVEN a PENDIENTE order with Papas x5 and stockActual=3, WHEN Admin tries Papas x10, THEN error "Stock insuficiente"
6. **FIADO re-validation**: GIVEN a FIADO order where new items exceed credit limit, WHEN Admin modifies, THEN error "Límite de crédito excedido"
7. **DOMICILIARIO blocked**: GIVEN a DOMICILIARIO user, WHEN they try to modify, THEN error "No autorizado"
8. **ENTREGADO blocked**: GIVEN an ENTREGADO order, WHEN any user tries to modify, THEN error "No se puede modificar un pedido entregado"
9. **Atomic rollback**: GIVEN a modification with 2 creates + 1 delete, WHEN the 2nd create fails, THEN zero items changed
10. **Audit trail structure**: WHEN an order is modified, THEN HistorialEstado shows same state, descriptive motivo, and user ID
