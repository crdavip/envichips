# Tasks: Fase 2 — Pedidos

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

Estimated changed lines: 600–900. Chained PRs recommended.

| Unit | Goal | PR | Base |
|------|------|----|------|
| 1 | Schema + validations + services | PR 1 | main |
| 2 | Server Actions + listado + badge | PR 2 | main/PR 1 |
| 3 | Wizard de 3 pasos | PR 3 | main/PR 2 |
| 4 | Detalle + transiciones + cobro | PR 4 | main/PR 3 |

## Phase 1: Fundación

- [x] F2.1 Agregar `Sequence` en `prisma/schema.prisma` con `@@unique([year, type])`; correr `npx prisma migrate dev --name add-sequence`
- [x] F2.2 Crear `lib/validations/pedidos.ts`: `createPedidoSchema`, `PedidoItemInput`, `updateEstadoSchema`, `confirmarCobroSchema`; reusar `MetodoPagoEnum`
- [x] F2.3 `lib/services/pedidos.ts`: `generarNumeroPedido()` con transacción atómica sobre `Sequence` formato `ENV-{año}-{00000}`
- [x] F2.4 `createPedido()` con `prisma.$transaction`: snapshot precio/costo, items, estado PENDIENTE o ENTREGADO si venta directa
- [x] F2.5 `actualizarEstado()` con validación de transiciones, descuento stock, incremento deuda si FIADO, registro en `HistorialEstado`
- [x] F2.6 `cancelarPedido()` rechaza si ENTREGADO; registra motivo en `HistorialEstado`
- [x] F2.7 `confirmarCobroAdmin()` valida `pagoEntregadoAdmin=false`; setea `pagoEntregadoEn = new Date()`

## Phase 2: Server Actions + Listado

- [x] F2.8 `app/dashboard/pedidos/actions.ts` con `"use server"`: `getPedidosAction` role-aware, `getPedidoByIdAction`, wrappers, `revalidatePath`
- [x] F2.9 `components/pedidos/PedidoStatusBadge.tsx` con colores: PENDIENTE gris, EN_CAMINO amarillo, ENTREGADO verde, CANCELADO rojo
- [x] F2.10 `components/pedidos/PedidoList.tsx` (cards mobile / tabla desktop) con filtros: estado, domiciliario, cliente, fecha
- [x] F2.11 `app/dashboard/pedidos/page.tsx` (Server Component) llama `getPedidosAction` con session; renderiza `PedidoList`

## Phase 3: Wizard de Creación

- [x] F2.12 `components/pedidos/PedidoForm.tsx` (`"use client"`) con paso en URL params (`?step=1|2|3`) y datos en `useState`
- [x] F2.13 Paso 1: buscador de clientes + "Venta rápida" con input libre; persistir selección al avanzar
- [x] F2.14 Paso 2: buscador artículos con debounce 300ms, cantidad numérica, subtotales en tiempo real
- [x] F2.15 Paso 3: resumen, descuento opcional, `metodoPago`, `domiciliarioId` opcional, observaciones; advertencia deuda si FIADO
- [x] F2.16 `app/dashboard/pedidos/create/page.tsx`; redirigir a `/dashboard/pedidos/[id]` al éxito

## Phase 4: Detalle + Transiciones + Cobro

- [x] F2.17 `components/pedidos/PedidoDetail.tsx` con items, totales COP, info cliente/domiciliario, timeline `HistorialEstado`
- [x] F2.18 `app/dashboard/pedidos/[id]/page.tsx` (Server Component) con `getPedidoByIdAction`; renderiza detalle + botones por rol/estado
- [x] F2.19 Botones: "Marcar en camino", "Marcar entregado" (modal `dineroCobrado`+`montoCobrado`), "Cancelar" (modal motivo), "Confirmar cobro admin"
- [x] F2.20 Placeholder `/dashboard/pedidos/[id]/print` para Fase 3 (botón Imprimir no rompe)

## Phase 5: Verificación

- [x] F2.21 Ejecutar `npm run lint` y `npm run build`; corregir tipos y warnings
- [ ] F2.22 Probar manualmente: crear PENDIENTE → EN_CAMINO → ENTREGADO con cobro → confirmar admin; cancelar otro pedido
- [ ] F2.23 Validar descuento de inventario y deuda FIADO en `prisma studio`
