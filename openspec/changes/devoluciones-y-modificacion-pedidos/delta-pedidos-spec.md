# Delta Spec: Pedidos — Modificación de Pedidos

> **Source**: `openspec/specs/pedidos/spec.md`
> **Change**: `devoluciones-y-modificacion-pedidos`
> **Type**: Modified capability — add Section 4 subsection: "Modificación de Pedidos"

## Changes to `openspec/specs/pedidos/spec.md`

### Section 4 — Gestión de Estados

**Add after existing Section 4 content** (before the `---` separator):

```markdown
### 4.1 Modificación de Pedidos (contenido del pedido)

**Files**: `lib/validations/pedidos.ts` (modificarPedidoSchema), `lib/services/pedidos.ts` (modificarPedido), `app/(dashboard)/pedidos/actions.ts` (modificarPedidoAction)

#### Purpose
Permitir que ADMIN/SUPERADMIN modifique el contenido de pedidos en estado PENDIENTE o EN_CAMINO — editar cantidades, agregar o eliminar items — con validación de inventario, recálculo de totales y auditoría en HistorialEstado.

#### Acceptance Criteria
- [ ] **Access**: Solo ADMIN y SUPERADMIN MUST poder modificar pedidos. DOMICILIARIO MUST NO tener acceso a la funcionalidad de modificación.
- [ ] **Estados permitidos**: La modificación MUST solo permitirse para pedidos en `PENDIENTE` o `EN_CAMINO`. Pedidos `ENTREGADO` o `CANCELADO` MUST NO ser modificables.
- [ ] **Operaciones sobre items**:
  - MUST poder aumentar o disminuir cantidad de items existentes
  - MUST poder eliminar items del pedido
  - MUST poder agregar nuevos items al pedido
  - MUST validar que al menos un item permanezca después de la modificación
  - Items existentes: MUST mantener el snapshot original de `precio` y `costo`
  - Items nuevos: MUST snapshotear el `precio` y `costo` actual del Articulo al momento de la modificación
- [ ] **Recálculo de totales**: MUST recalcular `subtotal = Σ(item.subtotal)` y `total = subtotal - descuento` (descuento no cambia)
- [ ] **Validación de stock**: MUST validar `articulo.stockActual >= item.cantidad` para TODOS los items finales. Si insuficiente: error y rechazar toda la modificación
- [ ] **Re-validación FIADO**: Si `metodoPago = FIADO` y el total cambia, MUST re-validar el límite de crédito vía `validateFiadoDebt`
- [ ] **Atomicidad**: TODAS las operaciones MUST ejecutarse en una sola transacción Prisma `$transaction`. Rollback total ante cualquier fallo
- [ ] **Auditoría**: MUST crear HistorialEstado con `estadoAntes === estadoDespues`, `motivo` descriptivo (ej: "Items modificados: Papas x5→x3, Plátanos x2 agregado"), y `cambiadoPorId`

#### Technical Notes
- Nueva función `modificarPedido()` en `lib/services/pedidos.ts`
- Diff de items: identificar cuáles crear, actualizar y eliminar
- Snapshots de precio/costo solo para items nuevos
- Re-validación completa de stock (no solo items cambiados)
- Patrón de transacción: delete removed → update existing → create new → recalc totals → update Pedido → create HistorialEstado
- Misma validación de roles que `cancelarPedido` (requireRole ADMIN/SUPERADMIN)
- Ver spec completa en `openspec/changes/devoluciones-y-modificacion-pedidos/specs/devoluciones-modificacion/spec.md`

#### Test Scenarios
1. **Editar cantidad**: DADO pedido PENDIENTE con Papas x5, CUANDO Admin cambia a Papas x3, ENTONCES cantidad actualizada, subtotal recalculado, HistorialEstado creado
2. **Agregar item**: DADO pedido PENDIENTE, CUANDO Admin agrega Plátanos x2, ENTONCES nuevo PedidoItem con precio/costo actual, total recalculado
3. **Eliminar item**: DADO pedido PENDIENTE con 3 items, CUANDO Admin elimina 1, ENTONCES item borrado, total recalculado
4. **Stock insuficiente**: DADO pedido con Papas x5 y stockActual=3, CUANDO Admin cambia a Papas x10, ENTONCES error "Stock insuficiente"
5. **FIADO re-validación**: DADO pedido FIADO donde agregar items excede límite, CUANDO Admin modifica, ENTONCES error "Límite de crédito excedido"
6. **DOMICILIARIO bloqueado**: DADO usuario DOMICILIARIO, CUANDO intenta modificar, ENTONCES error "No autorizado"
```
