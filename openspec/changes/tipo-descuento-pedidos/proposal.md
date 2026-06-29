# Propuesta: Tipo de Descuento en Pedidos

## Intención

El descuento actual en pedidos es un monto fijo COP sobre el total. Los admins necesitan un segundo modo que permita modificar el precio unitario por producto en cada pedido (descuento especial) sin alterar el precio de catálogo.

## Alcance

### Incluye
- Selector de tipo (GLOBAL | ESPECIAL) en Step 3 del wizard
- Modo ESPECIAL: precio unitario editable por ítem en Step 3
- Recalculo de totales según modo
- Validación Zod extendida
- Persistencia: `Pedido.tipoDescuento` + `PedidoItem.precioPersonalizado`
- Display del tipo en detalle, listado e impresión
- Solo SUPERADMIN y ADMIN

### Excluye
- Descuento porcentual (%)
- Historial de descuentos
- Modificación posterior del tipo

## Capacidades

### Nuevas
- Ninguna

### Modificadas
- `pedidos`: Selector excluyente GLOBAL/ESPECIAL en wizard. Validación, servicio, detalle, listado e impresión reflejan el tipo y precios modificados.

## Enfoque Técnico

1. **Schema**: `Pedido.tipoDescuento String @default("GLOBAL")`, `PedidoItem.precioPersonalizado Int?`
2. **Validación**: `tipoDescuento: z.enum(["GLOBAL","ESPECIAL"])`. Si ESPECIAL: cada item requiere `precioPersonalizado >= 0`. Si GLOBAL: descuento <= subtotal (actual)
3. **UI**: Selector radio antes del input actual. GLOBAL → input COP actual. ESPECIAL → ocultar input COP, mostrar precio editable por item
4. **Servicio**: Si ESPECIAL: subtotal = Σ(cantidad × precioPersonalizado), descuento = 0. Si GLOBAL: lógica actual
5. **Display**: Detalle, impresión, listado muestran tipo y precios por item

## Áreas Afectadas

| Área | Impacto |
|------|---------|
| `prisma/schema.prisma` | +2 campos |
| `lib/validations/pedidos.ts` | Schema extendido |
| `lib/services/pedidos.ts` | Lógica condicional |
| `components/pedidos/PedidoForm.tsx` | Step 3: selector + edición inline |
| `components/pedidos/PedidoDetail.tsx` | Display tipo/precios |
| `app/(dashboard)/pedidos/actions.ts` | Tipos de entrada |
| `app/(dashboard)/pedidos/[id]/imprimir/page.tsx` | Display factura |

## Riesgos

| Riesgo | Prob. | Mitigación |
|--------|-------|------------|
| Regresión en modo GLOBAL | Baja | Tests manuales del flujo existente |
| UX confusa entre modos | Media | Selector claro con texto explicativo |
| DOMICILIARIO forza acceso | Baja | Server Action ya valida rol |

## Rollback

1. Revertir migración Prisma
2. Revertir cambios en UI, servicio, validaciones y views
3. Verificar flujo GLOBAL funciona igual

## Dependencias

- Prisma migrate para nuevos campos

## Criterios de Éxito

- [ ] Selector visible solo para ADMIN/SUPERADMIN
- [ ] GLOBAL: comportamiento idéntico al actual
- [ ] ESPECIAL: precio editable por item, descuento global oculto
- [ ] ESPECIAL: total = Σ(cantidad × precioPersonalizado), descuento = 0
- [ ] Detalle e impresión reflejan tipo y precios
