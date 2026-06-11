# Propuesta: Arreglar Flujo de Pedidos

## Intención

Los domiciliarios no pueden ejecutar su flujo de trabajo porque (a) el server-side bloquea sus acciones con `requireRole("ADMIN")`, (b) no hay mecanismo para auto-asignarse pedidos, y (c) las ventas directas se saltan el estado PENDIENTE. El ciclo de cobro tampoco distingue métodos de pago. El resultado es que el sistema es inusable para el rol DOMICILIARIO.

## Alcance

### In Scope
- Corrección de guards de rol en `updateEstadoAction` y `cancelarPedidoAction`
- Mecanismo de auto-asignación (tomar pedido) para DOMICILIARIO
- Fix a `createPedido`: toda orden empieza como PENDIENTE (admin confirma entrega)
- Dashboard y listado adaptados para DOMICILIARIO (pedidos disponibles + activos)
- Estado de cobro explícito (`EstadoCobro`) con awareness del método de pago
- HistorialEstado para `confirmarCobroAdmin`
- Stock validation antes de ENTREGADO
- Transición PENDIENTE→ENTREGADO para admin

### Out of Scope
- Cancelación por DOMICILIARIO (solo admin puede cancelar)
- Abonos parciales, pagos split, recálculo de deuda
- Notificaciones push/WhatsApp
- Impresión de factura (ya existe en Fase 3)

## Capacidades

### Nuevas Capacidades
- `auto-asignacion-pedidos`: auto-asignación de pedidos PENDIENTE por DOMICILIARIO
- `estado-cobro`: estado de cobro explícito con awareness del método de pago

### Capacidades Modificadas
- `pedidos`: flujo de creación (siempre PENDIENTE), transiciones (DOMICILIARIO puede EN_CAMINO/ENTREGADO), stock validation, cobro con HistorialEstado
- `asignacion-domiciliario`: ampliado con auto-asignación (DOMICILIARIO) además de asignación admin
- `informes`: dashboard de DOMICILIARIO con pedidos disponibles, activos e historial

## Enfoque

1. **Schema**: agregar enum `EstadoCobro` (PENDIENTE, COBRADO_PARCIAL, COBRADO), ajustar `Pedido` y migrar datos existentes de `dineroCobrado`/`montoCobrado`
2. **Services**: agregar `tomarPedido`, ajustar `actualizarEstado` para role-aware, agregar stock validation, fix `createPedido`
3. **Actions**: relajar `updateEstadoAction` para DOMICILIARIO en transiciones permitidas, agregar `tomarPedidoAction`
4. **UI**: dashboard DOMICILIARIO, listado con pedidos disponibles, modal ENTREGADO payment-method-aware

## Áreas Afectadas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `prisma/schema.prisma` | Modificado | Enum EstadoCobro, campo estadoCobro en Pedido |
| `lib/services/pedidos.ts` | Modificado | createPedido, actualizarEstado, nuevo tomarPedido, stock validation |
| `lib/validations/pedidos.ts` | Modificado | Schemas ajustados |
| `app/(dashboard)/pedidos/actions.ts` | Modificado | Role guards, nuevo tomarPedidoAction |
| `lib/services/informes.ts` | Modificado | Dashboard DOMICILIARIO |
| `app/(dashboard)/page.tsx` | Modificado | Estadísticas DOMICILIARIO |
| `components/pedidos/PedidoDetail.tsx` | Modificado | Modales y botones role-aware |
| `components/pedidos/PedidoList.tsx` | Modificado | "Tomar pedido", pedidos disponibles |

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| Migración de datos existentes (dineroCobrado → EstadoCobro) | Media | Script de migración one-off, validar en staging |
| DOMICILIARIO malicioso marcando ENTREGADO sin cobrar | Baja | EstadoCobro independiente, admin confirma |
| Rollback de schema | Baja | Migración reversible, mantener campos viejos 1 ciclo |

## Plan de Rollback

- Schema: reversar migración Prisma, restaurar `dineroCobrado`/`montoCobrado`
- Actions: revertir `updateEstadoAction` a `requireRole("ADMIN")`
- git revert de cada PR por separado

## Dependencias

- Prisma migration (schema change)
- Ninguna externa

## Criterios de Éxito

- [ ] DOMICILIARIO puede ver pedidos PENDIENTE disponibles y auto-asignarse
- [ ] DOMICILIARIO puede marcar EN_CAMINO y ENTREGADO
- [ ] Toda orden nueva (con o sin domiciliario) empieza como PENDIENTE
- [ ] Admin puede pasar PENDIENTE→ENTREGADO en venta directa
- [ ] Modal ENTREGADO es payment-method-aware (FIADO no pide cobro)
- [ ] `confirmarCobroAdmin` crea HistorialEstado
- [ ] Dashboard DOMICILIARIO muestra datos útiles
- [ ] Stock validation impide ENTREGADO si falta inventario
