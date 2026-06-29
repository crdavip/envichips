# Tasks: Tipo de Descuento en Pedidos

## Review Workload Forecast

| Campo | Valor |
|-------|-------|
| Líneas estimadas cambiadas | ~360–460 |
| Riesgo de presupuesto 400 líneas | Medium |
| Chained PRs | Yes (forced) |
| Split sugerido | PR 1 (Backend) → PR 2 (UI) → PR 3 (Print) |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Work Units

| Unit | Goal | PR | Base |
|------|------|----|------|
| 1 | Schema + migración + validaciones + servicio | PR 1 | main |
| 2 | PedidoForm + PedidoDetail UI | PR 2 | main |
| 3 | Vista impresión + regresión manual | PR 3 | main |

---

## PR 1 — Modelo y Backend (~130–160 líneas)

- [x] T1.1 `prisma/schema.prisma`: Agregar `enum TipoDescuento { NINGUNO GLOBAL ESPECIAL }`, `tipoDescuento TipoDescuento @default(NINGUNO)` en Pedido, `precioOriginal Int` en PedidoItem
- [x] T1.2 `prisma/migrations/`: Migración + backfill — tipoDescuento="GLOBAL" si descuento>0, precioOriginal=precio en items
- [x] T1.3 `lib/validations/pedidos.ts`: Agregar `TipoDescuentoEnum`, `precioPersonalizado?: z.number().int().min(0)` en PedidoItemInput; cross-field validation post-parse (ESPECIAL→descuento=0, GLOBAL→descuento≤subtotal, NINGUNO→descuento=0)
- [x] T1.4 `lib/services/pedidos.ts` createPedido(): Si tipoDescuento=ESPECIAL → `precio=precioPersonalizado??articulo.precio`, `precioOriginal=articulo.precio`, descuento=0, total=subtotal; si GLOBAL/NINGUNO → precio y precioOriginal = articulo.precio
- [x] T1.5 `lib/services/pedidos.ts` modificarPedido(): Aceptar `precioPersonalizado` en items, propagar a create/update; mantener precioOriginal de items existentes
- [x] T1.6 `app/(dashboard)/pedidos/actions.ts` createPedidoAction(): Validación FIADO usa precio efectivo (precioPersonalizado si presente); tipos actualizados
- [x] T1.7 Manual: Verificar build y smoke test de pedido GLOBAL vía servicio directo

**AC**: `npm run build` pasa. Backfill correcto. createPedido() produce datos correctos en DB para los 3 modos.

## PR 2 — Frontend Wizard + Detalle (~220–280 líneas)

- [x] T2.1 `components/pedidos/PedidoForm.tsx` CartItem: Agregar `tipoDescuento`, `precioModificado?`, `precioOriginal` al type
- [x] T2.2 `components/pedidos/PedidoForm.tsx` Step 3: Agregar selector segmented NINGUNO/GLOBAL/ESPECIAL (solo ADMIN/SUPERADMIN). GLOBAL→input descuento. ESPECIAL→ocultar descuento, precio editable por item. NINGUNO→sin inputs. Recalcular totales en vivo
- [x] T2.3 `components/pedidos/PedidoForm.tsx` handleConfirm(): Enviar tipoDescuento y precioPersonalizado por item al action
- [x] T2.4 `components/pedidos/PedidoDetail.tsx` PedidoData + items: Agregar `tipoDescuento`. Mostrar badge tipo. Si ESPECIAL: precioOriginal tachado + precio efectivo + línea ahorro
- [x] T2.5 `components/pedidos/PedidoDetail.tsx` Modal modificar: Input editable de precio por item si tipo=ESPECIAL. Enviar precioPersonalizado en modificarPedidoAction

**AC**: Wizard crea pedidos en 3 modos con cálculos correctos. Detalle refleja tipo y precios. Modal modificar permite editar precios en ESPECIAL.

## PR 3 — Impresión + Pulido (~40–60 líneas)

- [x] T3.1 `app/(dashboard)/pedidos/[id]/imprimir/page.tsx`: Badge tipoDescuento. Si ESPECIAL: columna precioOriginal + precio efectivo, línea "Descuento especial"
- [ ] T3.2 Manual: Regresión GLOBAL — crear, detalle, imprimir idéntico a antes del cambio
- [ ] T3.3 Manual: Consistencia cross-flow — crear→detalle→imprimir→modificar→detalle en todos los modos

**AC**: Print refleja tipo y precios. GLOBAL regression OK. Todos los flujos consistentes.

### Rollback por PR

| PR | Rollback |
|----|----------|
| PR 1 | `npx prisma migrate down` + revert schema + revert validations/service/actions |
| PR 2 | Revert `PedidoForm.tsx` + `PedidoDetail.tsx` |
| PR 3 | Revert `imprimir/page.tsx` |

### Siguiente paso

Listo para implementar vía sdd-apply. Empezar con PR 1 (stacked-to-main).
