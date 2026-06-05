# Tasks: Fase 5 — Informes

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | ~650-850 (4 PRs, ~380 each) |
| 400-line budget risk | Medium (each PR designed to fit within budget) |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 |
| Delivery strategy | force-chained |
| Chain strategy | stacked-to-main |
| Decision needed before apply | No |

## PR 1 — Infraestructura base + Movimiento CRUD

**Estimated lines: ~350-400**
**Target: pr/1/fase-5-informes-infraestructura**

- [x] F1.1: Add soft-delete fields to Movimiento model in schema.prisma (eliminado Boolean, eliminadoEn DateTime?, eliminadoPorId String?, motivoEliminacion String?)
- [x] F1.2: Run `npx prisma migrate dev --name add_movimiento_soft_delete`
- [x] F1.3: Create `lib/services/movimientos.ts` — CRUD (create, soft-delete) + queries (getMovimientos with filters, getResumenCaja with totalIngresos/totalGastos/saldoActual)
- [x] F1.4: Create `lib/validations/movimientos.ts` — Zod schemas: createMovimientoSchema, deleteMovimientoSchema
- [x] F1.5: Create `app/dashboard/informes/caja/actions.ts` — server actions: createMovimientoAction, deleteMovimientoAction, getMovimientosAction
- [x] F1.6: Verify: `npx prisma generate && npx tsc --noEmit` passes
- [x] F1.7: Commit PR 1

## PR 2 — Dashboard real + Resumen del día

**Estimated lines: ~350-400**
**Target: pr/2/fase-5-informes-dashboard**

- [x] F2.1: Create `lib/services/informes.ts` with queries:
  - getResumenDelDia: ventasHoy, gananciaHoy, pedidosEntregados, pedidosPendientes, stockBajo, sinStock, clientesEnDeuda, totalACobrar
  - All accept dateRange and domiciliarioId filters
  - Use date-fns for date boundaries
  - Use Promise.all(getDeudaCliente) for total a cobrar
- [x] F2.2: Modify `app/dashboard/page.tsx` — replace static stats array with Suspense + real data queries
  - Wrap stats grid in Suspense with Skeleton fallback
  - Keep existing layout and quick actions unchanged
  - Use formatCOP() for monetary values
- [x] F2.3: Create `app/dashboard/informes/page.tsx` — Resumen del día:
  - Metric cards (ventas, ganancia, pendientes)
  - Alert cards (stock bajo, sin stock, clientes en deuda)
  - Navigation links to sub-report pages
  - Skeleton loading states
- [x] F2.4: Verify: `npm run build` passes
- [x] F2.5: Commit PR 2

## PR 3 — Ventas + Inventario

**Estimated lines: ~380-420**
**Target: pr/3/fase-5-informes-ventas-inventario**

- [x] F3.1: Add getVentas query to lib/services/informes.ts:
  - groupBy articuloId on PedidoItem for entregado pedidos in period
  - Join with Articulo for nombre/presentacion
  - Calculate % del total, top 10 with CSS bars data
  - Summary: totalVendido, totalGanancia, masVendido, masRentable
  - Filter by domiciliarioId and dateRange
- [x] F3.2: Add getInventario query to lib/services/informes.ts:
  - All articles with stock data
  - ingresos from CompraItem in period
  - egresos from PedidoItem for ENTREGADO pedidos in period
  - valorInventario = stockActual * costo
  - Estado: OK/BAJO/SIN_STOCK
- [x] F3.3: Create `app/dashboard/informes/ventas/page.tsx` — server page, imports getVentas, passes data to VentasTable
- [x] F3.4: Create `components/informes/VentasTable.tsx` — "use client" table with CSS bars and sorting
- [x] F3.5: Create `app/dashboard/informes/inventario/page.tsx` — server page, imports getInventario
- [x] F3.6: Create `components/informes/InventarioTable.tsx` — "use client" table with stock badges
- [x] F3.7: Verify: `npx tsc --noEmit` passes
- [x] F3.8: Commit PR 3

## PR 4 — Caja + Ganancias + Domiciliarios

**Estimated lines: ~380-420**
**Target: pr/4/fase-5-informes-caja-ganancias-domiciliarios**

- [x] F4.1: Add getGanancias query to lib/services/informes.ts
- [x] F4.2: Add getDomiciliarios query to lib/services/informes.ts
- [x] F4.3: Create `app/dashboard/informes/caja/page.tsx`
- [x] F4.4: Create `components/informes/CajaTable.tsx`
- [x] F4.5: Create `components/informes/CajaForm.tsx`
- [x] F4.6: Create `app/dashboard/informes/ganancias/page.tsx` with role gate
- [x] F4.7: Create `components/informes/GananciasCards.tsx`
- [x] F4.8: Create `app/dashboard/informes/domiciliarios/page.tsx`
- [x] F4.9: Create `components/informes/DomiciliariosTable.tsx`
- [x] F4.10: Verify: `npx tsc --noEmit` passes
- [x] F4.11: Commit PR 4
