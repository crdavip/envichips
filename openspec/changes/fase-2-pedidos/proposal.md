# Proposal: Fase 2 — Pedidos

## Intent
Implementar el módulo de Pedidos según PRD v1.1 sección 7 para permitir a Envichips gestionar el ciclo completo de pedidos: creación, seguimiento, estados, cobro y descuento de inventario, mejorando la operativa de distribución y reduciendo errores manuales.

## Scope

### In Scope
- Wizard de 3 pasos para crear pedidos (cliente, productos, resumen)
- Listado de pedidos con filtros por rol (domiciliario ve solo sus de hoy; admin ve todos)
- Detalle del pedido con items, totales, info de cliente/domiciliario y historial de estados
- Gestión de estados: PENDIENTE → EN_CAMINO → ENTREGADO (con seguimiento de cobro) o CANCELADO
- Descuento automático de inventario al cambiar estado a ENTREGADO
- Cancelación de pedidos con motivo y reversión de inventario si estaba en EN_CAMINO
- Venta directa (sin domiciliario, va directamente a ENTREGADO)
- Ciclo de cobro: domiciliario marca dineroCobrado/montoCobrado en ENTREGADO; admin confirma pagoEntregadoAdmin

### Out of Scope
- Impresión de tickets/comprobantes (deferido a Fase 3)
- Informes avanzados de pedidos (deferido a Fase 4)
- Integración con pasarelas de pago externas (deferido a Fase 3)

## Capabilities

### New Capabilities
- pedidos: Gestión completa de pedidos para Envichips SaaS, incluyendo creación, listado, detalle, transición de estados, descuento de inventario, cancelación, venta directa y ciclo de cobro.

### Modified Capabilities
- None

## Approach
Seguir los patrones existentes del proyecto:
1. **Server Actions**: Crear acciones en `app/dashboard/pedidos/actions.ts` siguiendo el patrón de `articulos/actions.ts` (consultas: getPedidosAction, getPedidoByIdAction, getPedidosByDomiciliarioAction; mutaciones: createPedidoAction, updateEstadoAction, cancelarPedidoAction).
2. **Service Layer**: Implementar lógica pura en `lib/services/pedidos.ts` con funciones transaccionales para creación, actualización de estado y cancelación, usando `prisma.$transaction` para actualizaciones de inventario.
3. **Validaciones**: Definir esquemas Zod en `lib/validations/pedidos.ts` reutilizando enums existentes (MetodoPago, EstadoPedido) y creando schemas para creación, actualización de estado y cancelación.
4. **Componentes**: Construir componentes cliente con `"use client"` y shadcn/ui en `/components/pedidos/` (PedidoForm, PedidoList, PedidoDetail, PedidoStatusFollower) siguiendo patrones de responsividad y manejo de estado de React 19.
5. **Rutas**: Definir rutas en `app/dashboard/pedidos/` para listado (`page.tsx`), creación (`create/page.tsx`), detalle (`[id]/page.tsx`) y seguimiento de cobro si es necesario.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/dashboard/pedidos/` | New | Rutas de Next.js para el módulo de pedidos |
| `components/pedidos/` | New | componentes React (PedidoForm, PedidoList, PedidoDetail, etc.) |
| `lib/services/pedidos.ts` | New | capa de servicio Prisma para lógica de base de datos |
| `lib/validations/pedidos.ts` | New | esquemas Zod para validación de datos |
| `app/dashboard/pedidos/actions.ts` | New | Server Actions para operaciones CRUD y de estado |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Inconsistencia en el stock al actualizar estados de pedido | Media | Usar transacciones de Prisma en todas las operaciones que modifiquen stock; escribir tests de integración para flujos de estado |
| Complejidad en el manejo de roles y filtros en listados | Baja | Reutilizar patrones de filtrado del módulo de artículos; centralizar lógica de autorización en servicios |
| Errores en el ciclo de cobro que lleven a discrepancies contables | Media | Implementar auditoría de cambios en campos de cobro; validar transiciones de estado con pruebas unitarias |

## Rollback Plan
1. Revertir cambios en código: eliminar carpetas `app/dashboard/pedidos/`, `components/pedidos/`, `lib/services/pedidos.ts`, `lib/validations/pedidos.ts`, `app/dashboard/pedidos/actions.ts`.
2. Revertir migraciones de base de datos: como no se modificó el esquema (los modelos Pedido, PedidoItem, HistorialEstado ya existen), no se requieren cambios en Prisma.
3. Limpiar caché de Next.js: ejecutar `npm run build` para asegurar que no queden rutas obsoletas.

## Dependencies
- Modelo Pedido existente en `prisma/schema.prisma` (ya definido)
- Enums EstadoPedido y MetodoPago existentes
- Módulo de artículos para referencia de patrones (sin dependencia funcional directa)

## Success Criteria
- [ ] Un usuario puede crear un pedido completo mediante el wizard de 3 pasos
- [ ] El listado de pedidos muestra correctamente los datos según el rol del usuario
- [ ] Al cambiar estado a ENTREGADO, el stock se decrementa automáticamente para cada ítem
- [ ] Un domiciliario puede marcar cobro parcial o total en un pedido ENTREGADO
- [ ] Un admin puede confirmar recepción de efectivo mediante el campo pagoEntregadoAdmin
- [ ] Pedidos pueden ser cancelados con reversión de stock si estaban en estado EN_CAMINO
- [ ] Las ventas directas (sin domiciliario) van directamente a estado ENTREGADO