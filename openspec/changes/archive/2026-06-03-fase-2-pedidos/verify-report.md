# Verify Report: Fase 2 — Pedidos

> Envichips SaaS · Informe de verificación
> Fecha: 2026-06-03

---

## Build

```text
npm run build → ✅ Compiled successfully (Next.js 16.2.7)
TypeScript: ✅ Passed
Pages generated: 9/9
Lint: 2 pre-existing warnings in lib/auth.ts (not part of this change)
```

## Summary

| Tipo | Cantidad |
|------|----------|
| CRITICAL | 0 |
| WARNING | 1 |
| SUGGESTION | 2 |

## Status

**PASS** — todas las funcionalidades core implementadas, build limpio, solo issues menores.

---

## Completeness

| Métrica | Valor |
|---------|-------|
| Tasks totales | 23 |
| Tasks completadas | 22 |
| Tasks pendientes | 1 (F2.23 — validación manual en Prisma Studio) |
| Especificaciones cubiertas | 7/7 secciones |

## Spec Compliance Matrix

| Sección | Requerimiento | Estado | Evidencia |
|---------|--------------|--------|-----------|
| **1. Crear Pedido** | Wizard 3 pasos con URL params | ✅ COMPLIANT | `PedidoForm.tsx` — `useSearchParams('step')` |
| | Paso 1: búsqueda clientes + venta rápida | ✅ COMPLIANT | `PedidoForm.tsx` — `getClientesAction` con debounce |
| | Paso 2: búsqueda artículos + carrito | ✅ COMPLIANT | `PedidoForm.tsx` — `getArticulosForPedidoAction` + quantity inputs |
| | Paso 3: resumen, descuento, metodoPago | ✅ COMPLIANT | `PedidoForm.tsx` — summary with discount/method/domiciliario |
| | FIADO warning deuda | ✅ COMPLIANT | `PedidoForm.tsx` — debt warning when FIADO + client selected |
| | Venta directa → ENTREGADO | ✅ COMPLIANT | `services/pedidos.ts` — `createPedido` sets estado=ENTREGADO if no domiciliarioId |
| | Redirección a detalle al crear | ✅ COMPLIANT | `create/page.tsx` — redirect a `/dashboard/pedidos/[id]` |
| **2. Listado** | Rol Domiciliario: solo sus pedidos | ✅ COMPLIANT | `services/pedidos.ts` — `getPedidos` filtra por domiciliarioId + fecha hoy |
| | Rol Admin: todos con filtros | ✅ COMPLIANT | `PedidoList.tsx` — 5 filtros (estado, fecha, cliente, domiciliario) |
| | Badge de estado por color | ✅ COMPLIANT | `PedidoStatusBadge.tsx` — 4 variantes de color |
| | Cards mobile + tabla desktop | ✅ COMPLIANT | `PedidoList.tsx` — `lg:hidden` cards + `hidden lg:block` table |
| | Paginación | ⚠️ PARTIAL | `PedidoList.tsx` — no implementa paginación server-side |
| **3. Detalle** | Info completa del pedido | ✅ COMPLIANT | `PedidoDetail.tsx` — header, info card, items table |
| | Timeline de historial estados | ✅ COMPLIANT | `PedidoDetail.tsx` — vertical timeline con dots + líneas |
| | Botones por rol/estado | ✅ COMPLIANT | `PedidoDetail.tsx` — 4 botones con visibility checks |
| **4. Estados** | PENDIENTE → EN_CAMINO | ✅ COMPLIANT | `services/pedidos.ts` — `actualizarEstado` valida transición |
| | EN_CAMINO → ENTREGADO + stock | ✅ COMPLIANT | `services/pedidos.ts` — decremento atómico en transacción |
| | EN_CAMINO → CANCELADO | ✅ COMPLIANT | `services/pedidos.ts` — `cancelarPedido` con validación |
| | HistorialEstado en cada cambio | ✅ COMPLIANT | `services/pedidos.ts` — creación en cada transición |
| | FIADO: actualización deuda | ✅ COMPLIANT | `services/pedidos.ts` — `cliente.deuda += total` en ENTREGADO |
| **5. Ciclo Cobro** | dineroCobrado + montoCobrado en ENTREGADO | ✅ COMPLIANT | `PedidoDetail.tsx` — modal toggle Sí/No + monto input |
| | pagoEntregadoAdmin por admin | ✅ COMPLIANT | `PedidoDetail.tsx` — botón + `confirmarCobroAdmin` |
| | pagoEntregadoEn timestamp | ✅ COMPLIANT | `services/pedidos.ts` — `new Date()` en `confirmarCobroAdmin` |
| **6. Server Actions** | 6 acciones implementadas | ✅ COMPLIANT | `actions.ts` — queries + mutaciones con Zod validation |
| | Error handling consistente | ✅ COMPLIANT | Todas retornan `{ data: T } | { error: string }` |
| | revalidatePath en mutaciones | ✅ COMPLIANT | Cada mutación llama `revalidatePath("/dashboard/pedidos")` |
| **7. Validaciones** | Schemas Zod completos | ✅ COMPLIANT | `pedidos.ts` — 4 schemas + 4 output types |
| | Reutilización MetodoPagoEnum | ✅ COMPLIANT | Importado de `articulos.ts` |

## Correctness (Static Evidence)

| Requerimiento | Estado | Notas |
|--------------|--------|-------|
| Sequence model para numeroPedido | ✅ Implementado | `schema.prisma` + `generarNumeroPedido()` con upsert atómico |
| Snapshots precio/costo | ✅ Implementado | `createPedido()` lee Articulo y guarda en PedidoItem |
| Transiciones validadas | ✅ Implementado | `ALLOWED_TRANSITIONS` map + validación de motivo en cancelación |
| Transacciones atómicas | ✅ Implementado | `prisma.$transaction` en create/estado/confirm |
| Venta directa auto ENTREGADO | ✅ Implementado | Condicional en `createPedido()` |
| Print placeholder | ✅ Implementado | `/dashboard/pedidos/[id]/imprimir` con back button |

## Coherence (Design Decisions)

| Decisión | Seguida? | Notas |
|----------|----------|-------|
| D1: Sequence para numeroPedido | ✅ Sí | `Sequence` model + upsert atómico |
| D2: URL params para wizard steps | ✅ Sí | `?step=1|2|3` via `useSearchParams` |
| D3: Stock solo en ENTREGADO | ✅ Sí | Decremento solo en `actualizarEstado` con estado ENTREGADO |
| D4: Role filtering en service layer | ✅ Sí | `getPedidos()` recibe `{ id, rol }` del session |
| D5: Snapshots precio/costo | ✅ Sí | Leídos al crear pedido, guardados en PedidoItem |

---

## Issues Found

### CRITICAL
- None.

### WARNING
1. **Paginación no implementada** — `PedidoList.tsx` carga todos los pedidos sin paginación server-side. Con muchos pedidos, puede degradar performance. El spec dice "SHOULD tener paginación".

### SUGGESTION
1. **Filtro de domiciliarios derivado de datos** — `PedidoList.tsx` extrae domiciliarios de los pedidos ya cargados. Sería más preciso usar `getDomiciliariosAction()` para el dropdown.
2. **Sin tests automatizados** — No hay test runner configurado en el proyecto. Considerar agregar Vitest para testing unitario de servicios y componentes.

---

## Verdict

**PASS** ✅

22/23 tasks completadas. Build compila limpio. Las 7 secciones del spec están cubiertas. Todos los patrones del proyecto se siguen consistentemente. Las transiciones de estado con inventario usan transacciones atómicas. Solo queda pendiente la verificación manual en Prisma Studio (F2.23) cuando haya PostgreSQL disponible.
